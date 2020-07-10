//link routes
const express = require('express');
const router = express.Router();

//get database
const firebase = require('../database');

//get bcrypt hashing functions
const bcrypt = require('bcrypt');
const saltRounds = 10;

//GET "register" page
router.get('/register', (req, res) => {
    return res.render('register', {page: 'register'});
});

/*POST "regist" page
- get username/password from form
- validate usernames and passwords
- if successful => login
- else => display error messages
*/
router.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('password', 'Password must be between 8-100 characters').len(8, 100);
    req.checkBody('password', 'Password must include one lowercase character, one uppercase character, a number, and a special character')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/, "i");
    req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(password);

    const validateErrors = Object.values(req.validationErrors());
    const sameUsernames = 
        await firebase.database().ref('users/')
        .orderByChild('username').equalTo(username).once('value');

    if (sameUsernames.exists()) {
        validateErrors.push({
            location: 'body', param: 'username', msg: 'Username already exists', value: ''
        });
    }
    if (validateErrors.length !== 0){
        return res.render('register', {page: 'registration error', errors: req.validationErrors()});
    }

    await bcrypt.hash(password, saltRounds, (err, hash) => {

        if (err) console.error(err);
        
        const user = { username: username, password: hash };
        const addedRecord = firebase.database().ref('users/').push(user);
        const userId = addedRecord.key;
        firebase.database().ref(`users/${userId}/id`).set(userId);

        req.login(userId, err => {
            if (err) console.error(err);
            return res.redirect('/');
        });
    });
});

module.exports = router