let _ = require('lodash');
let yaml = require('js-yaml');
let path = require('path');
let fs = require('fs');
let WebHDFS = require('webhdfs');

let config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '..', 'config.yml'), 'utf-8'));

exports.SERVER = _.pick(config['SERVER'], ['ADDRESS', 'PORT', 'SECRET_KEYS', 'MAXAGE']);

exports.DB_CONFIG_PATH = path.resolve(__dirname, '..', config['DB_CONFIG_PATH']);

exports.hdfs = WebHDFS.createClient({
    user: 'root',
    host: 'namenode',
    port: 50070,
    path: '/webhdfs/v1'
});
