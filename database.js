const firebase = require('firebase'); //npm i firebase

const firebaseConfig = {
    apiKey: "AIzaSyCYBF-Lk-b2AH9PhYYWhlnntkprhdZi-dc",
    authDomain: "mycoolapp-49429.firebaseapp.com",
    databaseURL: "https://mycoolapp-49429.firebaseio.com",
    projectId: "mycoolapp-49429",
    storageBucket: "mycoolapp-49429.appspot.com",
    messagingSenderId: "1084506225639",
    appId: "1:1084506225639:web:dcbc588e5ab2986827db42",
    measurementId: "G-H2662RL7KF"
};

const db = firebase.initializeApp(firebaseConfig);

module.exports = db;




