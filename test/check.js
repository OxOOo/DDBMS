let mongoose = require('mongoose');
let _ = require('lodash');

(async () => {

let dbs = _.range(1, 4).map(i => `db${i}`);
let uri = `mongodb://${dbs}/tmp?replicaSet=DDBMS1&connectTimeoutMS=30000&readPreference=secondary`;
console.log(uri);
let conn = await mongoose.createConnection(uri, {useNewUrlParser: true, useUnifiedTopology: true});

setInterval(async () => {
    console.log('==================');
    console.log(conn.states[conn.readyState]);
    let members = (await conn.db.executeDbAdminCommand({replSetGetStatus: 1})).members;
    let master = _.find(members, m => m.stateStr === 'PRIMARY');
    console.log('master : ', master.name);
    console.log(members.map(m => `${m.name}:${m.health}`).join('  '));

    // let new_dbs = members.filter(m => m.stateStr === 'PRIMARY').map(m => `${m.name}`).join(',');
    // let new_uri = `mongodb://${new_dbs}/tmp`;
    // console.log(new_uri);
    // conn.close();
    // conn = await mongoose.createConnection(new_uri, {useNewUrlParser: true, useUnifiedTopology: true});

    // console.time('collection');
    await conn.db.createCollection('users');
    // console.timeEnd('collection');
    // console.time('count');
    console.log('users:', await conn.db.collection('users').countDocuments());
    // console.timeEnd('count');
}, 1000);

})();
