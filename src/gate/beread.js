let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: String,
    timestamp: Date,
    aid: String,
    readNum: Number,
    readUidList: [String],
    commentNum: Number,
    commentUidList: [String],
    agreeNum: Number,
    agreeUidList: [String],
    shareNum: Number,
    shareUidList: [String]
});
