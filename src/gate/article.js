let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: String,
    timestamp: Date,
    aid: String,
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
