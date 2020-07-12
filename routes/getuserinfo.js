const express = require('express');
const router = express.Router();

const { authenticationMiddleware } = require('../utils/middlewares');

router.get('/getuserinfo', authenticationMiddleware(), async (req, res) => {
    const userInfo = req.user;
    delete userInfo.password;
    res.json(userInfo);
})

module.exports = router