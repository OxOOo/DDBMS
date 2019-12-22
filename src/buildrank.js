let gate = require('./gate');

async function main () {
    try {
        await gate.buildRank();
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await main();
    process.exit(0);
})();
