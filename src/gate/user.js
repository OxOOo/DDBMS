let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: {
        type: String,
        index: true,
        unique: true
    },
    timestamp: Date,
    uid: {
        type: String,
        index: true,
        unique: true
    },
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
