let mongoose = require('mongoose');
let _ = require('lodash');

const PORTS = [30001, 30002, 30003];

(async () => {
    let uri = `mongodb://${PORTS.map(port => `db${port-30000}`)}/tmp`;
    console.log(uri);
    let conn = await mongoose.createConnection(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    await conn.db.createCollection('users');

    for(let i = 0; i < 1000; i ++) {
        await conn.db.collection('users').insertOne({ name: 'username'+Math.random() });
    }
    process.exit(0);
})();
