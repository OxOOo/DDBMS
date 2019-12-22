let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: String,
    timestamp: Date,
    category: String,
    temporalGranularity: String, // temporalGranularity= “daily”, “weekly”, or “monthly”
    articleAidList: [{
        aid: String,
        readNum: Number
    }]
});
