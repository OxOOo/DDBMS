let gate = require('./gate');
let fs = require('fs');
let path = require('path');

const article_path = path.resolve(__dirname, '..', 'export/article.dat');
const user_path = path.resolve(__dirname, '..', 'export/user.dat');
const read_path = path.resolve(__dirname, '..', 'export/read.dat');

async function main () {
    try {
        if (!fs.existsSync(path.dirname(article_path))) {
            fs.mkdirSync(path.dirname(article_path));
        }
        await gate.exportData(user_path, article_path, read_path);
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await main();
    process.exit(0);
})();
