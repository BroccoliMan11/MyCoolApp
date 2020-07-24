/*set up database*/
const admin = require('firebase-admin');

const serviceAccount = {
    "type":"service_account",
    "project_id":"mycoolapp-49429",
    "private_key_id":process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    "private_key":process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    "client_email":"firebase-adminsdk-jt2e6@mycoolapp-49429.iam.gserviceaccount.com",
    "client_id":"100036334673357470339",
    "auth_uri":"https://accounts.google.com/o/oauth2/auth",
    "token_uri":"https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url":process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
}
  
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://mycoolapp-49429.firebaseio.com/'
});

module.exports = admin.database();