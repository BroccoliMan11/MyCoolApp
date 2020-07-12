const express = require('express');
const router = express.Router();

const { authenticationMiddleware } = require('../utils/middlewares');

router.get('/profile', authenticationMiddleware(), (req, res) => {
    return res.render(
        'profile',
        {
            page: 'profile',
            username: req.user.username,
            password: req.user.password
        }
    );
});

module.exports = router