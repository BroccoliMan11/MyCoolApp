const express = require('express');
const router = express.Router();

const getUserInfo = require('../utils/getuserinfo');
const authtenicationMiddleware = require('../utils/authmidfunc');

router.get('/getuserinfo', authtenicationMiddleware(), async (req, res) => {
    const userInfo = await getUserInfo(req.user);
    res.json({id: userInfo.id, username: userInfo.username});
})

module.exports = router