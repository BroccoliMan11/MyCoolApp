const express = require('express');
const router = express.Router();

const getUserInfo = require('../utils/getuserinfo');
const authenticationMiddleware = require('../utils/authmidfunc');

router.get('/profile', authenticationMiddleware(), async (req, res) => {
    const userInfo = await getUserInfo(req.user);
    return res.render(
        'profile',
        {
            page: 'profile',
            username: userInfo.username,
            password: userInfo.password
        }
    );
});

module.exports = router