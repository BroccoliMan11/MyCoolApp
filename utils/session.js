const session = require('express-session');
const firebase = require('../database');
const FirebaseStore = require('connect-session-firebase')(session);

module.exports = session({
    store: new FirebaseStore({
        database: firebase.database()
    }),
    secret: 'hdakhdewkfsdnbhjsegyw',
    resave: false,
    saveUninitialized: false
});