//link these routes
const express = require('express');
const router = express.Router();

//middleware functions
const { authenticationMiddleware } = require('../utils/middlewares');

/*Summary: render "profile" page with user's details */
router.get('/', authenticationMiddleware(), (req, res) => {
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