const session = require('express-session');
const db = require('../testing/database');
const { FirestoreStore } = require('@google-cloud/connect-firestore');

module.exports = session({
    store: new FirestoreStore({
    dataset: db
    }),
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true,
})