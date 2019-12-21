let mongoose = require('mongoose');
let _ = require('lodash');

const PORTS = [30001, 30002, 30003];

(async () => {
    let uri = `mongodb://${PORTS.map(port => `db${port-30000}`)}/tmp`;
    console.log(uri);
    let conn = await mongoose.createConnection(uri, {useNewUrlParser: true, useUnifiedTopology: true});

    let config = (await conn.db.executeDbAdminCommand({replSetGetConfig: 1})).config;
    config.version ++;
    config.members.push({
        _id: _.max(config.members.map(m => m._id)) + 1,
        host: 'db2'
    });
    console.log(await conn.db.executeDbAdminCommand({replSetReconfig: config, force: false}));

    process.exit(0);
})();
