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
    title: String,
    category: String,
    abstract: String,
    articleTags: String,
    authors: String,
    language: String,
    text: String,
    image: String,
    video: String
});
