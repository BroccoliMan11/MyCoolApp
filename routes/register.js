//link these routes
const express = require('express');
const router = express.Router();

//get bcrypt hashing functions
const bcrypt = require('bcrypt');
const saltRounds = 10;

//database functions
const { createNewUser } = require('../utils/dbmanipulate');
const { findUserByUsername } = require('../utils/dbretrieve');

/*Summary: render "register" page*/
router.get('/', (req, res) => {
    return res.render('register', {page: 'register'});
});

/*Summary: register for new account
1. validate usernames and passwords from form
2. if validation successful => login (passport) AND redirect to "home" page
3. else => display error messages
*/
router.post('/', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('password', 'Password must be between 8-100 characters').len(8, 100);
    req.checkBody('password', 'Password must include one lowercase character, one uppercase character, a number, and a special character')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/, "i");
    req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(password);

    const validationErrors = Object.values(req.validationErrors());
    const userFoundByUsername = await findUserByUsername(username);

    if (userFoundByUsername) {
        validationErrors.push({ location: 'body', param: 'username', msg: 'Username already exists', value: '' });
    }
    
    if (validationErrors.length !== 0){
        return res.render('register', {page: 'registration error', errors: validationErrors});
    }

    await bcrypt.hash(password, saltRounds, async (err, hashedPassword) => {

        if (err) console.error(err);
        const addingUserData = { username: username, password: hashedPassword };
        const createdUser = await createNewUser(addingUserData);

        req.login(createdUser, err => {
            if (err) console.error(err);
            return res.redirect('/');
        });
    });
});

module.exports = router