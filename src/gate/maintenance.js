let mongoose = require('mongoose');
let config = require('../config');
let DB = require('./DB');
let net = require('net');
let _ = require('lodash');
let utility = require('utility');
let fs = require('fs');

class Maintenance {
    constructor (db_name, repl_name) {
        this.db_name = db_name;
        this.repl_name = repl_name;

        this.available_dbs = [];
        this.db_ids = {};
        this.db_ids_change = () => {};
        this.db = null;
    }
    sleep (ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    TestTCP (host, port) {
        return new Promise((resolve) => {
            let socket = net.connect({port, host, timeout: 100});
            socket.on('connect', () => {
                socket.end();
                resolve(true);
            });
            socket.on('error', () => {
                socket.end();
                resolve(false);
            });
        });
    }
    async GetConnection () {
        for (let db of this.available_dbs) {
            let uri = `mongodb://${db}/${this.db_name}`;
            try {
                if (!await this.TestTCP(db, 27017)) {
                    console.log('[SetupConnect]tcp port not open', db);
                } else {
                    let conn = await mongoose.createConnection(uri, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        connectTimeoutMS: 1000,
                        socketTimeoutMS: 1000,
                        autoReconnect: false
                    });
                    let isMaster = await conn.db.command({isMaster: 1});
                    if (!isMaster.ismaster) {
                        conn.close();
                        console.log('[SetupConnect]not master', db);
                    } else {
                        console.log('[SetupConnect]success connect to', db);
                        return conn;
                    }
                }
            } catch (e) {
                console.log('[SetupConnect]error connect to', db);
                console.log(e);
            }
        }
        return null;
    }
    async ScanAliveDBs () {
        let alive_dbs = [];
        let tests = this.available_dbs.map(db => this.TestTCP(db, 27017));
        let results = await Promise.all(tests);
        for (let i = 0; i < this.available_dbs.length; i++) {
            if (results[i]) alive_dbs.push(this.available_dbs[i]);
        }
        return alive_dbs;
    }
    SetAvailableDBs (available_dbs) {
        this.available_dbs = available_dbs;
    }
    SetDBIds (db_ids) {
        this.db_ids = db_ids;
    }
    SetOnDBIdsChange (func) {
        this.db_ids_change = func;
    }
    async Loop () {
        let conn = null;

        while (true) {
            conn = await this.GetConnection();
            if (conn) break;
            await this.sleep(1000);
        }
        this.db = new DB(conn);

        {
            let members = (await conn.db.executeDbAdminCommand({replSetGetStatus: 1})).members;
            for (let mem of members) {
                this.db_ids[mem.name.split(':')[0]] = mem._id;
            }
            this.db_ids_change(this.db_ids);
        }

        // 保持链接
        let current_dbs = [];
        while (true) {
            let alive_dbs = await this.ScanAliveDBs();
            if (utility.md5(alive_dbs) !== utility.md5(current_dbs)) {
                console.log('change dbs to', alive_dbs);
                let new_conn = await this.GetConnection();

                let config = (await new_conn.db.executeDbAdminCommand({replSetGetConfig: 1})).config;
                config.version++;
                config.members = config.members.filter(m => _.some(alive_dbs, db => m.host.split(':')[0] === db));

                for (let db of alive_dbs) {
                    if (_.some(config.members, mem => mem.host.split(':')[0] === db)) continue;
                    if (!_.has(this.db_ids, db)) {
                        this.db_ids[db] = _.max(_.values(this.db_ids)) + 1;
                    }
                    config.members.push({
                        _id: this.db_ids[db],
                        host: db
                    });
                }

                console.log(await new_conn.db.executeDbAdminCommand({replSetReconfig: config, force: false}));
                this.db.SetCloseOnIdle();
                conn = new_conn;
                this.db = new DB(conn);

                this.db_ids_change(this.db_ids);
                current_dbs = alive_dbs;
                console.log('current dbs', current_dbs);
            }

            await this.sleep(100);
        }
    }
    async GetDB () {
        while (true) {
            if (this.db != null) return this.db;
            await this.sleep(1000);
        }
    }
};

let DBMS1 = module.exports.DBMS1 = new Maintenance('tmp', 'DBMS1');
let DBMS2 = module.exports.DBMS2 = new Maintenance('tmp', 'DBMS2');

let dbms_config = {
    DBMS1: {
        available_dbs: [],
        db_ids: {}
    },
    DBMS2: {
        available_dbs: [],
        db_ids: {}
    }
};
if (fs.existsSync(config.DB_CONFIG_PATH)) {
    dbms_config = JSON.parse(fs.readFileSync(config.DB_CONFIG_PATH, 'utf-8'));
}

DBMS1.SetAvailableDBs(dbms_config.DBMS1.available_dbs);
DBMS1.SetDBIds(dbms_config.DBMS1.db_ids);
DBMS1.SetOnDBIdsChange((db_ids) => {
    dbms_config.DBMS1.db_ids = _.clone(db_ids);
    fs.writeFileSync(config.DB_CONFIG_PATH, JSON.stringify(dbms_config, null, 4));
});

DBMS2.SetAvailableDBs(dbms_config.DBMS2.available_dbs);
DBMS2.SetDBIds(dbms_config.DBMS2.db_ids);
DBMS2.SetOnDBIdsChange((db_ids) => {
    dbms_config.DBMS2.db_ids = _.clone(db_ids);
    fs.writeFileSync(config.DB_CONFIG_PATH, JSON.stringify(dbms_config, null, 4));
});

DBMS1.Loop();
DBMS2.Loop();

module.exports.addDBMS1 = function (db) {
    dbms_config.DBMS1.available_dbs.push(db);
    DBMS1.SetAvailableDBs(dbms_config.DBMS1.available_dbs);
    fs.writeFileSync(config.DB_CONFIG_PATH, JSON.stringify(dbms_config, null, 4));
};

module.exports.addDBMS2 = function (db) {
    dbms_config.DBMS2.available_dbs.push(db);
    DBMS2.SetAvailableDBs(dbms_config.DBMS2.available_dbs);
    fs.writeFileSync(config.DB_CONFIG_PATH, JSON.stringify(dbms_config, null, 4));
};
