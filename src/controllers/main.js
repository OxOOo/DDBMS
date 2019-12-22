let Router = require('koa-router');
let gate = require('../gate');
let config = require('../config');
require('should');

const router = module.exports = new Router();

// ?page_size, page, category, language
router.get('/articles', async ctx => {
    let page_size = parseInt(ctx.query.page_size || 10);
    let page = parseInt(ctx.query.page || 1);
    let conditions = {};
    if (ctx.query.category) conditions.category = ctx.query.category;
    if (ctx.query.language) conditions.language = ctx.query.language;
    ctx.body = {
        success: true,
        data: await gate.getArticles(conditions, page, page_size)
    };
});
// ?aid
router.get('/article', async ctx => {
    await gate.readArticle(ctx.query.aid);
    ctx.body = {
        success: true,
        data: await gate.getArticle(ctx.query.aid)
    };
});
// ?aid
router.get('/article_comments', async ctx => {
    ctx.body = {
        success: true,
        data: await gate.getArticleComments(ctx.query.aid)
    };
});

// ?page_size, page, region, gender, language
router.get('/users', async ctx => {
    let page_size = parseInt(ctx.query.page_size || 10);
    let page = parseInt(ctx.query.page || 1);
    let conditions = {};
    if (ctx.query.region) conditions.region = ctx.query.region;
    if (ctx.query.gender) conditions.gender = ctx.query.gender;
    if (ctx.query.language) conditions.language = ctx.query.language;
    ctx.body = {
        success: true,
        data: await gate.getUsers(conditions, page, page_size)
    };
});
// ?uid
router.get('/user', async ctx => {
    ctx.body = {
        success: true,
        data: await gate.getUser(ctx.query.uid)
    };
});

// ?category, temporalGranularity
router.get('/popular_articles', async ctx => {
    ctx.body = {
        success: true,
        data: await gate.getPopularArticles(ctx.query.category, ctx.query.temporalGranularity)
    };
});

router.get('/article_text/:aid/:path', async ctx => {
    ctx.body = config.hdfs.createReadStream('/article' + ctx.params.aid + '/' + ctx.params.path);
});

router.get('/article_image/:aid/:path', async ctx => {
    ctx.type = 'jpg';
    ctx.body = config.hdfs.createReadStream('/article' + ctx.params.aid + '/' + ctx.params.path);
});

router.get('/article_video/:aid/:path', async ctx => {
    ctx.type = 'flv';
    ctx.body = config.hdfs.createReadStream('/article' + ctx.params.aid + '/' + ctx.params.path);
});

router.get('/admin/dbstatus', async ctx => {
    ctx.body = {
        success: true,
        data: gate.dbstatus()
    };
});
// host
router.post('/admin/add_dbms1', async ctx => {
    gate.addDBMS1(ctx.request.body.host);
    ctx.body = {
        success: true
    };
});
// host
router.post('/admin/add_dbms2', async ctx => {
    gate.addDBMS2(ctx.request.body.host);
    ctx.body = {
        success: true
    };
});

router.post('/gen_random_article', async ctx => {
    await gate.genRandomArticle();
    ctx.body = {
        success: true
    };
});
