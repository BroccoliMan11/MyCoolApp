//link these routes
const express = require('express');
const router = express.Router();

//middleware functions
const { authenticationMiddleware } = require('../utils/middlewares');

/*Summary: get user info (for clients)
1. retrieve the data of requesting user
2. delete the "password" property
3. send json to client
*/
router.get('/', authenticationMiddleware(), async (req, res) => {
    const userInfo = req.user;
    delete userInfo.password;
    res.json(userInfo);
})

module.exports = router