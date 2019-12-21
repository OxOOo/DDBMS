let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: String,
    timestamp: Date,
    uid: String,
    name: String,
    gender: String,
    email: String,
    phone: String,
    dept: String,
    grade: String,
    language: String,
    region: String,
    role: String,
    preferTags: String,
    obtainedCredits: String
});
