let mongoose = require('mongoose');
let net = require('net');
let _ = require('lodash');
let utility = require('utility');

const dbs = ['db1', 'db2', 'db3', 'db4', 'db5'];
const db_name = 'tmp';
const dbids = {};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function TestTCP(host, port) {
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

async function GetConnection() {
    for(let db of dbs) {
        let uri = `mongodb://${db}/${db_name}`;
        try {
            if (!await TestTCP(db, 27017)) {
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
        }
    }
    return null;
}

async function ScanAliveDBs() {
    let alive_dbs = [];
    let tests = dbs.map(db => TestTCP(db, 27017));
    let results = await Promise.all(tests);
    for(let i = 0; i < dbs.length; i ++) {
        if (results[i]) alive_dbs.push(dbs[i]);
    }
    return alive_dbs;
}

(async () => {
    let conn = null;

    while(true) {
        conn = await GetConnection();
        if (conn) break;
        await sleep(1000);
    }

    (async () => {
        {
            let members = (await conn.db.executeDbAdminCommand({replSetGetStatus: 1})).members;
            for(let mem of members) {
                dbids[mem.name.split(':')[0]] = mem._id;
            }
        }

        // 保持链接
        let current_dbs = [];
        while (true) {
            let alive_dbs = await ScanAliveDBs();
            if (utility.md5(alive_dbs) !== utility.md5(current_dbs)) {
                console.log('change dbs to', alive_dbs);
                let new_conn = await GetConnection();

                let config = (await new_conn.db.executeDbAdminCommand({replSetGetConfig: 1})).config;
                config.version ++;
                config.members = config.members.filter(m => _.some(alive_dbs, db => m.host.split(':')[0] == db));

                for(let db of alive_dbs) {
                    if (_.some(config.members, mem => mem.host.split(':')[0] === db)) continue;
                    if (!_.has(dbids, db)) {
                        dbids[db] = _.max(_.values(dbids)) + 1;
                    }
                    config.members.push({
                        _id: dbids[db],
                        host: db
                    });
                }

                console.log(await new_conn.db.executeDbAdminCommand({replSetReconfig: config, force: false}));
                conn.close();
                conn = new_conn;

                current_dbs = alive_dbs;
                console.log('current dbs', current_dbs);
            }

            await sleep(100);
        }
    })();

    while (true) {
        try {
            console.log('[1]');
            await conn.db.createCollection('users');
            console.log('[2]');
            console.log('users:', await conn.db.collection('users').countDocuments());
            console.log('[3]');
        } catch (e) {
            console.log('[4]');
            console.error(e);
            console.log('[5]');
        }
        console.log('[6]');
        await sleep(1000);
    }

    // let uri = `mongodb://${PORTS.map(port => `db${port-30000}`)}/tmp`;
    // console.log(uri);
    // let conn = await mongoose.createConnection(uri, {useNewUrlParser: true, useUnifiedTopology: true});

    // let members = (await conn.db.executeDbAdminCommand({replSetGetStatus: 1})).members;

    // let config = (await conn.db.executeDbAdminCommand({replSetGetConfig: 1})).config;
    // config.version ++;
    // config.members = config.members.filter(m => _.some(members, hm => hm.health===1 && hm.name===m.host));
    // console.log(config);
    // console.log(await conn.db.executeDbAdminCommand({replSetReconfig: config, force: false}));

    // process.exit(0);
})();
