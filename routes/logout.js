const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.logout();
    req.session.destroy(() => {
        return res.redirect('/');
    });
});

module.exports = router