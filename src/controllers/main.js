let Router = require('koa-router');
let gate = require('../gate');
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
    ctx.body = {
        success: true,
        data: await gate.getArticle(ctx.query.aid)
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

