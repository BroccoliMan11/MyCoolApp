//link these routes
const express = require('express');
const router = express.Router();

/*Summary: render "home" page*/
router.get('/', (req, res) => {
    return res.render('home', {page: 'home'});
});

module.exports = router
