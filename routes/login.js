const express = require('express');
const router = express.Router();

const passport = require('../utils/passport');

router.get('/login', (req, res,) => {
    return res.render('login', {page: 'login'});
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) console.error(err);
        if (!user) {
            const allErrors = [{ location: 'body', param: '', msg: 'Username or Password is Incorrect!', value: ''}];
            return res.render('login', {page: 'login', errors: allErrors});
        } 
        req.login(user, err => {
            if (err) console.error(err);
            return res.redirect('/');
        });
    })(req, res, next);
});

module.exports = router