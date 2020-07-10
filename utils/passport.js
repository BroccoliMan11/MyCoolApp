const firebase = require('../database');
const bcrypt = require('bcrypt');

const passport = require('passport'); 
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(async (username, password, done) => {
    const snapshot = 
        await firebase.database().ref('users/')
        .orderByChild('username').equalTo(username)
        .once('value');

    if (!snapshot.exists())  return done (null, false);

    const userId = Object.keys(snapshot.val())[0];
    const user = snapshot.val()[userId];
    const hashedPassword = user.password;

    const validUser = await bcrypt.compare(password, hashedPassword);

    if (validUser) return done(null, userId);
    return done(null, false);
    
}));

passport.serializeUser((userId, done) => {
    return done(null, userId);
});

passport.deserializeUser((userId, done) => {
    return done(null, userId);
});

module.exports = passport