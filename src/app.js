// 网站

let mount = require('koa-mount');
let Koa = require('koa');
let Router = require('koa-router');
let bodyParser = require('koa-bodyparser');
let path = require('path');
let session = require('koa-session');
let fs = require('fs');
let RateLimiterMemory = require('rate-limiter-flexible').RateLimiterMemory;

let config = require('./config');
let { SERVER } = require('./config');

let app = new Koa();

app.use(bodyParser({
    formLimit: '10GB'
}));
app.keys = [config.SERVER.SECRET_KEYS];
const CONFIG = {
    key: 'ddbms:sess', /** (string) cookie key (default is koa:sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    overwrite: true, /** (boolean) can overwrite or not (default true) */
    httpOnly: false, /** (boolean) httpOnly or not (default true) */
    signed: true, /** (boolean) signed or not (default true) */
    rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false) */
};
app.use(session(CONFIG, app));

app.use(async (ctx, next) => {
    ctx.state.ip = ctx.headers['x-real-ip'] || ctx.ip;
    await next();
});

let api = new Router();

api.use(require('koa-logger')());
// rate limit
const rateLimiter = new RateLimiterMemory({
    points: 100,
    duration: 1, // Per second
    blockDuration: 600 // 超出限制之后禁用时间（秒）
});
api.use(async (ctx, next) => {
    let ip = ctx.state.ip;
    try {
        await rateLimiter.consume(ip);
        await next();
    } catch (e) {
        console.log(`rate limit for ${ip}`);
        ctx.status = 403;
        ctx.body = `Server received too much request from your ip ${ip}.`;
    }
});
// error handle
api.use(async (ctx, next) => {
    try {
        ctx.set({
            'Cache-Control': 'nocache',
            'Pragma': 'no-cache',
            'Expires': -1
        });
        await next();
    } catch (e) {
        console.error(e);
        ctx.body = {
            success: false,
            message: e.message
        };
    }
});

api.use('', require('./controllers/index').routes());
api.use('', require('./controllers/main').routes());

app.use(mount('/api', api.routes()));
app.use(mount('/dist', require('koa-static')(path.join(__dirname, '..', 'dist'), {
    maxage: SERVER.MAXAGE
})));
app.use(async ctx => {
    ctx.type = 'text/html';
    ctx.body = fs.createReadStream(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(SERVER.PORT, SERVER.ADDRESS);

console.log(`listen on http://${SERVER.ADDRESS}:${SERVER.PORT}`);
