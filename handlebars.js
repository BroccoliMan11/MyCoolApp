const exphbs = require('express-handlebars');

const hbs = exphbs.create({
    helpers: require('./hbshelpers'),
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    extname: 'hbs',
    defaultLayout: 'index'
});

module.exports = hbs