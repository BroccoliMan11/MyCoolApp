//link these routes
const express = require('express');
const router = express.Router();

/*Summary: logout user
1. logout user (with passport)
2. destroy session
3. redirect user to "home" page*/
router.post('/', (req, res) => {
    req.logout();
    req.session.destroy(() => {
        return res.redirect('/');
    });
});

module.exports = router