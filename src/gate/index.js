let maintenance = require('./maintenance');
let _ = require('lodash');
let assert = require('assert');
let config = require('../config');
let path = require('path');
let fs = require('fs');
let moment = require('moment');

exports.addDBMS1 = function (db) {
    maintenance.addDBMS1(db);
};

exports.addDBMS2 = function (db) {
    maintenance.addDBMS2(db);
};

exports.dbstatus = function () {
    return maintenance.dbstatus();
};

exports.loadUsers = async function (users) {
    for (let item of users) {
        item.timestamp = new Date(parseInt(item.timestamp));
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
        await dbms1.User.collection.drop();
        await dbms1.User.collection.insertMany(users_for_dbms1);
        // await dbms1.User.insertMany(users_for_dbms1);
    });

    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms2.Run(async () => {
        await dbms2.User.collection.drop();
        await dbms2.User.collection.insertMany(users_for_dbms2);
        // await dbms2.User.insertMany(users_for_dbms2);
    });

    console.log('loadUsers success');
};
exports.loadArticles = async function (articles, article_storage_path) {
    for (let item of articles) {
        item.timestamp = new Date(parseInt(item.timestamp));
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
        await dbms1.Article.collection.drop();
        await dbms1.Article.collection.insertMany(articles_for_dbms1);
        // await dbms1.Article.insertMany(articles_for_dbms1);
    });

    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms2.Run(async () => {
        await dbms2.Article.collection.drop();
        await dbms2.Article.collection.insertMany(articles_for_dbms2);
        // await dbms2.Article.insertMany(articles_for_dbms2);
    });

    if (article_storage_path) {
        // save file to hdfs
        let pending_articles = _.clone(articles);
        let thread = async () => {
            let writeFile = (localpath, remotepath) => {
                return new Promise((resolve, reject) => {
                    let local_stream = fs.createReadStream(localpath);
                    let remote_stream = config.hdfs.createWriteStream(remotepath);
                    local_stream.pipe(remote_stream);
                    remote_stream.on('error', reject);
                    remote_stream.on('finish', resolve);
                });
            };
            while (pending_articles.length > 0) {
                let article = pending_articles.pop();
                for (let prop of ['text', 'image', 'video']) {
                    if (!article[prop]) continue;
                    let files = article[prop].split(',');
                    for (let file of files) {
                        file = file.trim();
                        if (file.length === 0) continue;
                        let filepath = path.resolve(article_storage_path, 'article' + article.aid, file);
                        await writeFile(filepath, path.join('/article' + article.aid, file));
                    }
                }
            }
        };
        let threads = _.range(10).map(i => thread());
        await Promise.all(threads);
    }

    console.log('loadArticles success');
};
exports.loadReads = async function (reads) {
    for (let item of reads) {
        item.timestamp = new Date(parseInt(item.timestamp));
    }
    for (let read of reads) {
        for (let key of _.keys(read)) {
            if (key.endsWith('OrNot')) {
                read[key] = !!parseInt(read[key]);
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
                await dbms1.Read.collection.drop();
                await dbms1.Read.collection.insertMany(reads_for_dbms1);
                // await dbms1.Read.insertMany(reads_for_dbms1);
            });

            await dbms2.Run(async () => {
                await dbms2.Read.collection.drop();
                await dbms2.Read.collection.insertMany(reads_for_dbms2);
                // await dbms2.Read.insertMany(reads_for_dbms2);
            });
        });
    });

    console.log('loadReads success');
};
exports.exportData = async (user_file_path, article_file_path, read_file_path) => {
    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();

    await dbms1.Run(async () => {
        await dbms2.Run(async () => {
            let BATCH_SIZE = 1024;

            let user_fd = fs.openSync(user_file_path, 'w');
            for (let offset = 0; ; offset += BATCH_SIZE) {
                let users = await dbms1.User.find({}).skip(offset).limit(BATCH_SIZE);
                if (users.length === 0) break;
                for (let user of users) {
                    fs.writeSync(user_fd, JSON.stringify(_.pick(user.toJSON(), [
                        'id', 'timestamp', 'uid', 'name', 'gender', 'email', 'phone', 'dept', 'grade',
                        'language', 'region', 'role', 'preferTags', 'obtainedCredits'
                    ])) + '\n');
                }
            }
            for (let offset = 0; ; offset += BATCH_SIZE) {
                let users = await dbms2.User.find({}).skip(offset).limit(BATCH_SIZE);
                if (users.length === 0) break;
                for (let user of users) {
                    fs.writeSync(user_fd, JSON.stringify(_.pick(user.toJSON(), [
                        'id', 'timestamp', 'uid', 'name', 'gender', 'email', 'phone', 'dept', 'grade',
                        'language', 'region', 'role', 'preferTags', 'obtainedCredits'
                    ])) + '\n');
                }
            }
            fs.closeSync(user_fd);

            let article_fd = fs.openSync(article_file_path, 'w');
            for (let offset = 0; ; offset += BATCH_SIZE) {
                let articles = await dbms2.Article.find({}).skip(offset).limit(BATCH_SIZE);
                if (articles.length === 0) break;
                for (let article of articles) {
                    fs.writeSync(article_fd, JSON.stringify(_.pick(article.toJSON(), [
                        'id', 'timestamp', 'aid', 'title', 'category', 'abstract', 'articleTags', 'authors',
                        'language', 'text', 'image', 'video'
                    ])) + '\n');
                }
            }
            fs.closeSync(article_fd);

            let read_fd = fs.openSync(read_file_path, 'w');
            for (let offset = 0; ; offset += BATCH_SIZE) {
                let reads = await dbms1.Read.find({}).skip(offset).limit(BATCH_SIZE);
                if (reads.length === 0) break;
                for (let read of reads) {
                    fs.writeSync(read_fd, JSON.stringify(_.pick(read.toJSON(), [
                        'id', 'timestamp', 'uid', 'aid', 'readTimeLength', 'readSequence', 'readOrNot', 'aggreeOrNot',
                        'commentOrNot', 'commentDetail', 'shareOrNot'
                    ])) + '\n');
                }
            }
            for (let offset = 0; ; offset += BATCH_SIZE) {
                let reads = await dbms2.Read.find({}).skip(offset).limit(BATCH_SIZE);
                if (reads.length === 0) break;
                for (let read of reads) {
                    fs.writeSync(read_fd, JSON.stringify(_.pick(read.toJSON(), [
                        'id', 'timestamp', 'uid', 'aid', 'readTimeLength', 'readSequence', 'readOrNot', 'aggreeOrNot',
                        'commentOrNot', 'commentDetail', 'shareOrNot'
                    ])) + '\n');
                }
            }
            fs.closeSync(read_fd);
        });
    });
};

exports.getArticles = async (conditions = {}, page = 1, page_size = 10) => {
    conditions = conditions || {};

    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms2.Run(async () => {
        let total_count = await dbms2.Article.find(conditions).count();
        let total_page = Math.floor((total_count + page_size - 1) / page_size);
        let articles = await dbms2.Article.find(conditions).limit(page_size).skip(page_size * page - page_size);
        articles = articles.map(item => item.toObject());

        let bereads = (await dbms2.BeRead.find({aid: {$in: articles.map(item => item.aid)}})).map(item => item.toObject());
        for (let article of articles) {
            _.assign(article, _.pick(_.find(bereads, beread => beread.aid === article.aid) || {}, ['readNum', 'commentNum', 'agreeNum', 'shareNum']));
        }

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
        let beread = await dbms2.BeRead.findOne({aid});
        article = article.toObject();
        if (beread) {
            article = _.assign(article, _.pick(beread, [
                'readNum', 'readUidList', 'commentNum', 'commentUidList', 'agreeNum', 'agreeUidList', 'shareNum', 'shareUidList'
            ]));
        }
        return article;
    });
};
exports.getArticleComments = async (aid) => {
    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms1.Run(async () => {
        return await dbms2.Run(async () => {
            let reads = _.concat(
                await dbms1.Read.find({aid, commentOrNot: true}),
                await dbms2.Read.find({aid, commentOrNot: true})
            );
            reads = reads.map(item => item.toObject());
            let users = _.concat(
                await dbms1.User.find({uid: {$in: reads.map(item => item.uid)}}),
                await dbms2.User.find({uid: {$in: reads.map(item => item.uid)}})
            );
            users = users.map(item => item.toObject());
            let keys = [];
            if (reads.length > 0 && users.length > 0) {
                keys = _.difference(_.keys(users[0]), _.keys(reads[0]));
            }
            for (let read of reads) {
                _.assign(read, _.pick(_.find(users, u => u.uid === read.uid) || {}, keys));
            }
            return reads;
        });
    });
};
exports.genRandomArticle = async () => {
    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms1.Run(async () => {
        return await dbms2.Run(async () => {
            let aid = await dbms2.Article.count();
            let id = 'a' + aid;
            let timestamp = new Date();
            let title = 'title' + aid;
            let category = Math.random() < 0.5 ? 'technology' : 'science';
            let abstract = 'none';
            let articleTags = 'tag0';
            let authors = 'author0';
            let language = Math.random() < 0.5 ? 'en' : 'zh';
            let text = _.repeat('Content', Math.floor(Math.random() * 50) + 1);
            let image = '';
            let video = '';

            let article = {id, aid, timestamp, title, category, abstract, articleTags, authors, language, text: 'text.txt', image, video};

            let writeFile = require('util').promisify(config.hdfs.writeFile.bind(config.hdfs));
            await writeFile(path.join('/article' + aid, 'text.txt'), text);

            if (category === 'science') {
                await dbms1.Article.create(article);
                await dbms2.Article.create(article);
            } else {
                await dbms2.Article.create(article);
            }
        });
    });
};
exports.getUsers = async (conditions = {}, page = 1, page_size = 10) => {
    conditions = conditions || {};
    assert(page_size % 2 === 0);

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
                let users2 = await dbms2.User.find(conditions).limit(page_size - users1.length).skip(page_size * page - page_size - total_count1);
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
            for (let article of articles) {
                articles_idx[article.aid] = article.toObject();
            }

            for (let read of user_reads) {
                _.assign(read, articles_idx[read.aid]);
            }

            user.reads = user_reads;

            return user;
        });
    });
};

// 读文章
exports.readArticle = async (aid) => {
    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms1.Run(async () => {
        await dbms2.Run(async () => {
            let article = await dbms2.Article.findOne({aid});
            let user = null;
            let place = -1;
            if (Math.random() < 0.5) {
                let total_count = await dbms1.User.count();
                user = await dbms1.User.findOne({}).skip(Math.floor(Math.random() * total_count));
                place = 0;
            } else {
                let total_count = await dbms2.User.count();
                user = await dbms2.User.findOne({}).skip(Math.floor(Math.random() * total_count));
                place = 1;
            }

            let read = {
                id: String(Math.random()),
                timestamp: new Date(),
                uid: user.uid,
                aid: article.aid,
                readTimeLength: Math.floor(Math.random() * 100),
                readSequence: Math.floor(Math.random() * 100),
                readOrNot: true,
                aggreeOrNot: false,
                commentOrNot: false,
                commentDetail: '',
                shareOrNot: false
            };
            if (place === 0) {
                await dbms1.Read.create(read);
            } else {
                await dbms2.Read.create(read);
            }

            beread_pending_aids.push(aid);
        });
    });
};

exports.getPopularArticles = async (category, temporalGranularity) => {
    let dbms2 = await maintenance.DBMS2.GetDB();
    return await dbms2.Run(async () => {
        let popular = await dbms2.Rank.findOne({category, temporalGranularity});
        if (popular) popular = popular.toObject();
        else popular = {};
        let items = popular.articleAidList || [];
        let articles = (await dbms2.Article.find({aid: {$in: items.map(item => item.aid)}})).map(item => item.toObject());
        for (let item of items) {
            _.assign(item, _.find(articles, a => a.aid === item.aid) || {});
        }
        return items;
    });
};

// Build BeRead
let beread_pending_aids = [];
function sleep (ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
(async () => {
    let thread = async () => {
        while (true) {
            if (beread_pending_aids.length === 0) {
                await sleep(100);
                continue;
            }
            let aid = beread_pending_aids.pop();
            if (beread_pending_aids.length % 100 === 0) {
                console.log('remain beread_pending_aids :', beread_pending_aids.length);
            }
            let dbms1 = await maintenance.DBMS1.GetDB();
            let dbms2 = await maintenance.DBMS2.GetDB();
            await dbms1.Run(async () => {
                await dbms2.Run(async () => {
                    let article = await dbms2.Article.findOne({aid});

                    let id = aid;
                    let timestamp = Date.now();
                    let readUidList = _.concat(
                        (await dbms1.Read.find({aid}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid}).select('uid')).map(item => item.uid)
                    );
                    let readNum = readUidList.length;
                    let commentUidList = _.concat(
                        (await dbms1.Read.find({aid, commentOrNot: true}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid, commentOrNot: true}).select('uid')).map(item => item.uid)
                    );
                    let commentNum = commentUidList.length;
                    let agreeUidList = _.concat(
                        (await dbms1.Read.find({aid, agreeOrNot: true}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid, agreeOrNot: true}).select('uid')).map(item => item.uid)
                    );
                    let agreeNum = agreeUidList.length;
                    let shareUidList = _.concat(
                        (await dbms1.Read.find({aid, shareOrNot: true}).select('uid')).map(item => item.uid),
                        (await dbms2.Read.find({aid, shareOrNot: true}).select('uid')).map(item => item.uid)
                    );
                    let shareNum = shareUidList.length;

                    await dbms2.BeRead.findOneAndUpdate({aid}, {
                        id,
                        aid,
                        timestamp,
                        readNum,
                        readUidList,
                        commentNum,
                        commentUidList,
                        agreeNum,
                        agreeUidList,
                        shareNum,
                        shareUidList
                    }, {upsert: true});
                    if (article.category === 'science') {
                        await dbms1.BeRead.findOneAndUpdate({aid}, {
                            id,
                            aid,
                            timestamp,
                            readNum,
                            readUidList,
                            commentNum,
                            commentUidList,
                            agreeNum,
                            agreeUidList,
                            shareNum,
                            shareUidList
                        }, {upsert: true});
                    }
                });
            });
        }
    };

    let threads = _.range(10).map(i => thread());
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
        if (beread_pending_aids.length === 0) break;
        await sleep(1000);
    }
};

exports.buildRank = async function () {
    let dbms1 = await maintenance.DBMS1.GetDB();
    let dbms2 = await maintenance.DBMS2.GetDB();
    await dbms1.Run(async () => {
        await dbms2.Run(async () => {
            for (let category of ['science', 'technology']) {
                for (let temporalGranularity of ['daily', 'weekly', 'monthly']) {
                    let days = 0;
                    if (temporalGranularity === 'daily') days = 1;
                    else if (temporalGranularity === 'weekly') days = 7;
                    else if (temporalGranularity === 'monthly') days = 30;
                    let timestamp = moment(1506332297000 + 1000000 * 10000).subtract(moment.duration(days, 'days')).toDate();

                    let aids = (await dbms2.Article.find({category}).select('aid')).map(item => item.aid);

                    let part1 = await dbms1.Read.aggregate([
                        {$match: {aid: {$in: aids}, timestamp: {$gte: timestamp}}},
                        {$group: {_id: '$aid', count: {$sum: 1}}}
                    ]);
                    let part2 = await dbms2.Read.aggregate([
                        {$match: {aid: {$in: aids}, timestamp: {$gte: timestamp}}},
                        {$group: {_id: '$aid', count: {$sum: 1}}}
                    ]);
                    let readNums = {};
                    for (let item of _.concat(part1, part2)) {
                        if (!_.has(readNums, item._id)) {
                            readNums[item._id] = 0;
                        }
                        readNums[item._id] += item.count;
                    }
                    let items = _.keys(readNums).map(item => ({aid: item, readNum: readNums[item]}));
                    items.sort((a, b) => b.readNum - a.readNum);
                    items = items.slice(0, 5);
                    console.log(items);

                    if (category === 'science') {
                        await dbms1.Rank.findOneAndUpdate({category, temporalGranularity}, {
                            id: String(Math.random()),
                            timestamp: new Date(),
                            category,
                            temporalGranularity,
                            articleAidList: items
                        }, {upsert: true});
                        await dbms2.Rank.findOneAndUpdate({category, temporalGranularity}, {
                            id: String(Math.random()),
                            timestamp: new Date(),
                            category,
                            temporalGranularity,
                            articleAidList: items
                        }, {upsert: true});
                    } else {
                        await dbms2.Rank.findOneAndUpdate({category, temporalGranularity}, {
                            id: String(Math.random()),
                            timestamp: new Date(),
                            category,
                            temporalGranularity,
                            articleAidList: items
                        }, {upsert: true});
                    }
                }
            }
        });
    });
};
