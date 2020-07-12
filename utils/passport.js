const bcrypt = require('bcrypt');

const passport = require('passport'); 
const LocalStrategy = require('passport-local').Strategy;

const { getUserInfo, findUserByUsername } = require('./dbretrieve');

passport.use(new LocalStrategy(async (username, password, done) => {
    const userFoundByUsername = await findUserByUsername(username);
    if (!userFoundByUsername) return done(null, false);
    const isValidUser = bcrypt.compareSync(password, userFoundByUsername.password);
    if (isValidUser) return done(null, userFoundByUsername);
    return done(null, false);
}));

passport.serializeUser((user, done) => {
    return done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
    const user = await getUserInfo(userId);
    return done(null, user);
});

module.exports = passport