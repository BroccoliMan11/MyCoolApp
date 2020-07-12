const express = require('express');
const router = express.Router();

const passport = require('../utils/passport');

router.get('/login', (req, res,) => {
    return res.render('login', {page: 'login'});
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        console.log('authenticate');
        if (err) console.error(err);
        if (!user) {
            return res.render('login', {page: 'login', error: 'Username or Password is Incorrect!'});
        } 
        req.login(user, err => {
            console.log('login');
            if (err) console.error(err);
            return res.redirect('/');
        });
    })(req, res, next);
});

module.exports = router