var fs = require('fs');

var WebHDFS = require('webhdfs');
var hdfs = WebHDFS.createClient({
    user: 'root',
    host: 'namenode',
    port: 50070,
    path: '/webhdfs/v1'
});

var localFileStream = fs.createReadStream('./add.js');
var remoteFileStream = hdfs.createWriteStream('/add.js');
 
localFileStream.pipe(remoteFileStream);
 
remoteFileStream.on('error', function onError (err) {
    // Do something with the error
    console.log(err);
});

remoteFileStream.on('finish', function onFinish () {
    // Upload is done
    console.log('========');

    remoteFileStream = hdfs.createReadStream('/add.js');
    remoteFileStream.on('error', function onError (err) {
    // Do something with the error
    });
    
    remoteFileStream.on('data', function onChunk (chunk) {
    // Do something with the data chunk
        console.log(chunk.toString());
    });
    
    remoteFileStream.on('finish', function onFinish () {
    // Upload is done
    });
});
