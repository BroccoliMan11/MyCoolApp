//link these routes
const express = require('express');
const router = express.Router();

//get passport
const passport = require('../utils/passport');

/*Summary: render "login" page */
router.get('/', (req, res,) => {
    return res.render('login', {page: 'login'});
});

/*Summary: login
1. if no found user => display error message
2. else => login user (passport) AND redirect to "home" page */
router.post('/', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) console.error(err);
        if (!user) {
            return res.render('login', {page: 'login', error: 'Username or Password is Incorrect!'});
        } 
        req.login(user, err => {
            if (err) console.error(err);
            return res.redirect('/');
        });
    })(req, res, next);
});

module.exports = router