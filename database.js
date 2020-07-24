/*set up database*/
const admin = require('firebase-admin');
  
admin.initializeApp({
    credential: admin.credential.cert({
        "project_id":process.env.FIREBASE_ADMIN_PROJECT_ID,
        "private_key":process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email":process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    }),
    databaseURL:process.env.FIREBASE_DATABASE_URL
});

module.exports = admin.database();