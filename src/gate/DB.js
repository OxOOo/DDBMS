
module.exports = class DB {
    constructor (conn) {
        this.conn = conn;
        this.Article = conn.model('article', require('./article'));
        this.User = conn.model('user', require('./user'));
        this.Read = conn.model('read', require('./read'));
        this.BeRead = conn.model('beread', require('./beread'));
        this.Rank = conn.model('rank', require('./rank'));

        this.close_on_idle = false;
        this.using = 0;
    }
    TryClose () {
        if (this.close_on_idle && this.using === 0) {
            this.conn.close();
            console.log('closing connection');
        }
    }
    SetCloseOnIdle () {
        this.close_on_idle = true;
    }
    async Run (func) {
        try {
            this.using++;
            return await func();
        } finally {
            this.using--;
            this.TryClose();
        }
    }
};
