const bcrypt = require('bcrypt');

const passport = require('passport'); 
const LocalStrategy = require('passport-local').Strategy;

const { getUserInfo, findUserByUsername } = require('./dbretrieve');

/*Summary: authenticate user login */
passport.use(new LocalStrategy(async (username, password, done) => {
    const userFoundByUsername = await findUserByUsername(username);
    if (!userFoundByUsername) return done(null, false);
    const isValidUser = bcrypt.compareSync(password, userFoundByUsername.password);
    if (isValidUser) return done(null, userFoundByUsername);
    return done(null, false);
}));

/*Summary: serializes user details*/
passport.serializeUser((user, done) => {
    return done(null, user.id);
});

/*Summary: deserializes user details*/
passport.deserializeUser(async (userId, done) => {
    const user = await getUserInfo(userId);
    return done(null, user);
});

module.exports = passport