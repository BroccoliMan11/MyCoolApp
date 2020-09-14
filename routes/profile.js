//link these routes
const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const db = require("../database");

//middleware functions
const { authenticationMiddleware } = require('../utils/middlewares');
const { findUserByUsername } = require("../utils/dbretrieve");
const { updateMemberUsername } = require('../socketevents');

/*Summary: render "profile" page with user's details */
router.get('/', authenticationMiddleware(), (req, res) => {
    return res.render('profile', { username: req.user.username });
});

/*Summary: validates user input to change their personal details*/
router.post("/", authenticationMiddleware(), async (req, res) => {
    const { username, oldPassword, newPassword, changePassword, newPasswordConfirm } = req.body;
    const errors = [];

    await (async function validateUsername(){
        if (!username) return errors.push("Username cannot be empty!");
        if (typeof username !== "string") return errors.push("Username must be string!");
        if (username.trim() === "") return errors.push("Username cannot be empty!");
        const userFoundByUsername = await findUserByUsername(username);
        if (userFoundByUsername && userFoundByUsername.id !== req.user.id){
            return errors.push("User with username already exists!");
        }
    })();

    if (changePassword){
        (function validateOldPassword() {
            if (!oldPassword) return errors.push("Old password cannot be empty!");
            if (typeof oldPassword !== "string") return errors.push("Old password must be string!");
            if (oldPassword.trim() === "") return errors.push("Old password cannot be empty!");
            const isValidUser = bcrypt.compareSync(oldPassword, req.user.password);
            if (!isValidUser) return errors.push("Old password does not match with actual password!");
        })();
    
        (function validateNewPassword(){
            if (!newPassword) return errors.push("New password cannot be empty!");
            if (typeof newPassword !== "string") return errors.push("New password must be string!");
            if (newPassword.trim() === "") return errors.push("New paassword cannot be empty!");
            if (newPassword.length < 8 || newPassword.length > 100){
                return errors.push("New password must be between 8-100 characters");
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/i;
            if (!newPassword.match(passwordRegex)){
                return errors.push('New password must include one lowercase character, one uppercase character, a number, and a special character');
            }
        })();

        (function validateNewPasswordConfirmation(){
            if (!newPasswordConfirm) return errors.push("New password confirmation cannot be empty!");
            if (typeof newPasswordConfirm !== "string") return errors.push("New password confirmation must be string!");
            if (newPasswordConfirm.trim() === "") return errors.push("New password confirmation cannot be empty!");
            if (newPasswordConfirm !== newPassword) return errors.push("Confirmation password must be the same as the new password!");
        });
    }

    if (errors.length > 0){
        return res.render("profile", { errors, username: req.user.username });
    }

    if (req.user.username !== username){
        await db.ref(`users/${req.user.id}/username`).set(username);
        await updateMemberUsername(req.user, username);
    }

    if (changePassword){
        const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);
        await db.ref(`users/${req.user.id}/password`).set(hashedPassword);
    }

    return res.render("profile", { username , success: "Yor details have been changed!" });

}); 

module.exports = router