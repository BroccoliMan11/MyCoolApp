const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    console.log('you are at home page!');
    return res.render('home', {page: 'home'});
});

module.exports = router
