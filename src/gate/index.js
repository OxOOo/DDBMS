let maintenance = require('./maintenance');
let _ = require('lodash');
let assert = require('assert');

exports.addDBMS1 = function (db) {
    maintenance.addDBMS1(db);
};

exports.addDBMS2 = function (db) {
    maintenance.addDBMS2(db);
};

exports.loadUsers = async function (users) {
    for(let item of users) {
        item.timestamp = Date(item.timestamp);
    }

    let users_for_dbms1 = [];
    let users_for_dbms2 = [];

    for (let user of users) {
        if (user.region === 'Beijing') {
            users_for_dbms1.push(user);
        } else if (user.region === 'Hong Kong') {
            users_for_dbms2.push(user);
        } else {
            assert(false);
        }
    }

    let dbms1 = await maintenance.DBMS1.GetDB();
    await dbms1.Run(async () => {
        await dbms1.User.collection.insertMany(users_for_dbms1);
    });

    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms2.Run(async () => {
        await dbms2.User.collection.insertMany(users_for_dbms2);
    });

    console.log('loadUsers success');
};
exports.loadArticles = async function (articles) {
    for(let item of articles) {
        item.timestamp = Date(item.timestamp);
    }

    let articles_for_dbms1 = [];
    let articles_for_dbms2 = [];

    for (let article of articles) {
        if (article.category === 'science') {
            articles_for_dbms1.push(article);
            articles_for_dbms2.push(article);
        } else if (article.category === 'technology') {
            articles_for_dbms2.push(article);
        } else {
            assert(false);
        }
    }

    let dbms1 = await maintenance.DBMS1.GetDB();
    await dbms1.Run(async () => {
        await dbms1.Article.collection.insertMany(articles_for_dbms1);
    });

    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms2.Run(async () => {
        await dbms2.Article.collection.insertMany(articles_for_dbms2);
    });

    console.log('loadArticles success');
};
exports.loadReads = async function (reads) {
    for(let item of reads) {
        item.timestamp = Date(item.timestamp);
    }
    for(let read of reads) {
        for(let key of _.keys(read)) {
            if (key.endsWith('OrNot')) {
                read[key] = parseInt(read[key]) ? true : false;
            }
        }
    }

    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();

    await dbms1.Run(async () => {
        await dbms2.Run(async () => {
            let dbms1_uids = (await dbms1.User.find({}).select('uid')).map(item => item.uid);
            dbms1_uids = new Set(dbms1_uids);
            let dbms2_uids = (await dbms2.User.find({}).select('uid')).map(item => item.uid);
            dbms2_uids = new Set(dbms2_uids);

            let reads_for_dbms1 = [];
            let reads_for_dbms2 = [];

            for (let read of reads) {
                if (dbms1_uids.has(read.uid)) {
                    reads_for_dbms1.push(read);
                } else if (dbms2_uids.has(read.uid)) {
                    reads_for_dbms2.push(read);
                } else {
                    assert(false);
                }
            }

            await dbms1.Run(async () => {
                await dbms1.Read.collection.insertMany(reads_for_dbms1);
            });

            await dbms2.Run(async () => {
                await dbms2.Read.collection.insertMany(reads_for_dbms2);
            });
        });
    });

    console.log('loadReads success');
};

exports.getArticles = async (conditions = {}, page = 1, page_size = 10) => {
    conditions = conditions || {};

    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms2.Run(async () => {
        let total_count = await dbms2.Article.find(conditions).count();
        let total_page = Math.floor((total_count + page_size - 1) / page_size);
        let articles = await dbms2.Article.find(conditions).limit(page_size).skip(page_size * page - page_size);
        return {
            total_count,
            total_page,
            page_size,
            page,
            articles
        };
    });
};
exports.getArticle = async (aid) => {
    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms2.Run(async () => {
        let article = await dbms2.Article.findOne({aid});
        return article;
    });
};
exports.getUsers = async (conditions = {}, page = 1, page_size = 10) => {
    conditions = conditions || {};
    assert(page_size % 2 == 0);

    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms1.Run(async () => {
        return await dbms2.Run(async () => {
            let total_count1 = await dbms1.User.find(conditions).count();
            let total_count2 = await dbms2.User.find(conditions).count();
            let total_count = total_count1 + total_count2;
            let total_page = Math.floor((total_count + page_size - 1) / page_size);

            let users = [];
            if (page_size * page <= total_count1) {
                users = await dbms1.User.find(conditions).limit(page_size).skip(page_size * page - page_size);
            } else if (page_size * page - page_size > total_count1) {
                users = await dbms2.User.find(conditions).limit(page_size).skip(page_size * page - page_size - total_count1);
            } else {
                let users1 = await dbms1.User.find(conditions).limit(page_size).skip(page_size * page - page_size);
                let users2 = await dbms2.User.find(conditions).limit(page_size-users1.length).skip(page_size * page - page_size - total_count1);
                users = _.concat(users1, users2);
            }

            return {
                total_count,
                total_page,
                page_size,
                page,
                users
            };
        });
    });
};
exports.getUser = async (uid) => {
    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms1.Run(async () => {
        return await dbms2.Run(async () => {
            let user = null;
            let user_reads = [];

            user = await dbms1.User.findOne({uid});
            if (user) {
                user_reads = await dbms1.Read.find({uid});
            } else {
                user = await dbms2.User.findOne({uid});
                user_reads = await dbms2.Read.find({uid});
            }
            user = user.toObject();
            user_reads = user_reads.map(r => r.toObject());

            let articles = await dbms2.Article.find({aid: {$in: user_reads.map(r => r.aid)}});
            let articles_idx = {};
            for(let article of articles) {
                articles_idx[article.aid] = article.toObject();
            }

            for(let read of user_reads) {
                _.assign(read, articles_idx[read.aid]);
            }

            user.reads = user_reads;

            return user;
        });
    });
};


// Build BeRead
let beread_pending_aids = [];
function sleep (ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
(async () => {
    let thread = async () => {
        while (true) {
            if (beread_pending_aids.length == 0) {
                await sleep(100);
                continue;
            }
            let aid = beread_pending_aids.pop();
            let dbms1 = await maintenance.DBMS1.GetDB();
            let dbms2 = await maintenance.DBMS2.GetDB();
            await dbms1.Run(async () => {
                await dbms2.Run(async () => {
                    let article = await dbms2.Article.findOne({aid});

                    let id = aid;
                    let timestamp = Date.now();
                    let readNum = (await dbms1.Read.count({aid})) + (await dbms2.Read.count({aid}));
                    let readUidList = _.concat(
                        (await dbms1.Read.find({aid}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid}).select('uid')).map(item => item.uid)
                    );
                    let commentNum = (await dbms1.Read.count({aid, commentOrNot: true})) + (await dbms2.Read.count({aid, commentOrNot: true}));
                    let commentUidList = _.concat(
                        (await dbms1.Read.find({aid, commentOrNot: true}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid, commentOrNot: true}).select('uid')).map(item => item.uid)
                    );
                    let agreeNum = (await dbms1.Read.count({aid, agreeOrNot: true})) + (await dbms2.Read.count({aid, agreeOrNot: true}));
                    let agreeUidList = _.concat(
                        (await dbms1.Read.find({aid, agreeOrNot: true}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid, agreeOrNot: true}).select('uid')).map(item => item.uid)
                    );
                    let shareNum = (await dbms1.Read.count({aid, shareOrNot: true})) + (await dbms2.Read.count({aid, shareOrNot: true}));
                    let shareUidList = _.concat(
                        (await dbms1.Read.find({aid, shareOrNot: true}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid, shareOrNot: true}).select('uid')).map(item => item.uid)
                    );
                    
                    await dbms2.BeRead.findOneAndUpdate({aid}, {
                        id, aid, timestamp,
                        readNum, readUidList, commentNum, commentUidList,
                        agreeNum, agreeUidList, shareNum, shareUidList
                    }, {upsert: true});
                    if (article.category !== 'science') {
                        await dbms1.BeRead.findOneAndUpdate({aid}, {
                            id, aid, timestamp,
                            readNum, readUidList, commentNum, commentUidList,
                            agreeNum, agreeUidList, shareNum, shareUidList
                        }, {upsert: true});
                    }
                });
            });
        }
    };

    let threads = _.range(5).map(i => thread());
    try {
        await Promise.all(threads);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
})();

exports.buildAllBeRead = async function () {
    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms2.Run(async () => {
        let aids = (await dbms2.Article.find().select('aid')).map(item => item.aid);
        beread_pending_aids = _.concat(beread_pending_aids, aids);
    });
    while (true) {
        if (beread_pending_aids.length == 0) break;
        await sleep(1000);
    }
}
