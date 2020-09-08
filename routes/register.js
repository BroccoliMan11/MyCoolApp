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
    const { username, password, passwordMatch } = req.body;

    const errors = [];

    const validateUsername = async() => {
        if (!username) return errors.push({ param: "username", msg: "Username cannot be empty!" });
        if (typeof username !== "string") return errors.push({ param: "username", msg: "Username must be string!" });
        if (username.length < 4 || username.length > 15) {
            return errors.push({ param: "username", msg: "Username must be between 4-15 characters!" });
        }
        const userFoundByUsername = await findUserByUsername(username);
        if (userFoundByUsername){
            return errors.push({ param: "username", msg: "Username already taken!" });
        }
    }
    validateUsername();

    const validatePassword = () => {
        if (!password) return errors.push({ param: "password", msg: "Password cannot be empty!" });
        if (typeof password !== "string") return errors.push({ param: "password", msg: "Password must be string!" });
        if (password.length < 8 || password.length > 100){
            return errors.push({ param: "password", msg: "Password must be between 8-100 characters"});
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/;
        if (!password.match(passwordRegex)) {
            return errors.push({ param: "password", msg: "Password must include one lowercase character, one uppercase character, a number, and a special character"});
        }
    }
    validatePassword();

    const validatePasswordMatch = () => {
        if (!passwordMatch) return errors.push({ param: "passwordMatch", msg: "Password Match cannot be empty!"});
        if (typeof passwordMatch !== "string") return errors.push({ param: "passwordMatch", msg: "Password Match must be string!" });
        if (passwordMatch !== password) {
            return errors.push({ param: "passwordMatch", msg: "Password Match must match with Password!" });
        }
    }
    validatePasswordMatch();
    
    if (errors.length !== 0){
        return res.render('register', { errors });
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