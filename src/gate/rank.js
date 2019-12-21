let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: String,
    timestamp: Date,
    temporalGranularity: String, // temporalGranularity= “daily”, “weekly”, or “monthly”
    articleAidList: [String]
});
