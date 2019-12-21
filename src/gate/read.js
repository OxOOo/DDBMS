let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: String,
    timestamp: Date,
    uid: String,
    aid: String,
    readTimeLength: String,
    readSequence: String,
    readOrNot: Boolean,
    agreeOrNot: Boolean,
    commentOrNot: Boolean,
    commentDetail: String,
    shareOrNot: Boolean
});
