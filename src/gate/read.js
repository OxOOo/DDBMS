let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: {
        type: String,
        index: true
    },
    timestamp: Date,
    uid: {
        type: String,
        index: true
    },
    aid: {
        type: String,
        index: true
    },
    readTimeLength: String,
    readSequence: String,
    readOrNot: {
        type: Boolean,
        index: true
    },
    agreeOrNot: {
        type: Boolean,
        index: true
    },
    commentOrNot: {
        type: Boolean,
        index: true
    },
    commentDetail: String,
    shareOrNot: {
        type: Boolean,
        index: true
    }
});
