/* set session configurations */

const session = require('express-session');
const db = require('../database');
const FirebaseStore = require('connect-session-firebase')(session);

module.exports = session({
    store: new FirebaseStore({
        database: db
    }),
    secret: 'hdakhdewkfsdnbhjsegyw',
    resave: false,
    saveUninitialized: false
});