let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: {
        type: String,
        index: true,
        unique: true
    },
    timestamp: Date,
    aid: {
        type: String,
        index: true,
        unique: true
    },
    readNum: Number,
    readUidList: [String],
    commentNum: Number,
    commentUidList: [String],
    agreeNum: Number,
    agreeUidList: [String],
    shareNum: Number,
    shareUidList: [String]
});
