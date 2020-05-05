const firebase = require('firebase'); //npm i firebase

const firebaseConfig = {
    apiKey: process.env.DB_API_KEY ,
    authDomain: process.env.DB_AUTH_DOMAIN,
    databaseURL: process.env.DB_URL,
    projectId: process.env.DB_PROJECT_ID,
    storageBucket: process.env.DB_STORAGE_BUCKET,
    messagingSenderId: process.env.DB_MESSAGING_SENDER_ID,
    appId: process.env.DB_APP_ID,
    measurementId: process.env.DB_MEASUREMENT_ID
};

const db = firebase.initializeApp(firebaseConfig);

module.exports = db;




