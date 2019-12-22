let gate = require('./gate');
let fs = require('fs');
let path = require('path');

async function loadUsers (user_path) {
    let content = fs.readFileSync(user_path, 'utf-8');
    let lines = content.split('\n');
    let users = [];
    for (let line of lines) {
        line = line.trim();
        if (line.length === 0) continue;
        users.push(JSON.parse(line.trim()));
    }
    console.log('users num:', users.length);
    await gate.loadUsers(users);
}
async function loadArticles (article_path, article_storage_path) {
    let content = fs.readFileSync(article_path, 'utf-8');
    let lines = content.split('\n');
    let articles = [];
    for (let line of lines) {
        line = line.trim();
        if (line.length === 0) continue;
        articles.push(JSON.parse(line.trim()));
    }
    console.log('articles num:', articles.length);
    await gate.loadArticles(articles, article_storage_path);
}

async function loadReads (read_path) {
    let content = fs.readFileSync(read_path, 'utf-8');
    let lines = content.split('\n');
    let reads = [];
    for (let line of lines) {
        line = line.trim();
        if (line.length === 0) continue;
        reads.push(JSON.parse(line.trim()));
    }
    console.log('reads num:', reads.length);
    await gate.loadReads(reads);
}

const article_path = path.resolve(__dirname, '..', '3-sized-db-generation/article.dat');
const article_storage_path = path.resolve(__dirname, '..', '3-sized-db-generation', 'articles');
const user_path = path.resolve(__dirname, '..', '3-sized-db-generation/user.dat');
const read_path = path.resolve(__dirname, '..', '3-sized-db-generation/read.dat');

async function main () {
    try {
        await loadUsers(user_path);
        // await loadArticles(article_path, article_storage_path);
        await loadArticles(article_path, null);
        await loadReads(read_path);
        await gate.buildAllBeRead();
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await main();
    process.exit(0);
})();
