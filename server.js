require('dotenv').config(); //parses environment variables

const path = require('path'); //for combining path strings
const express = require('express');
const app = express(); //create a server

//create websocket and link to server
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
require('./socketevents')(io);

//static folder (client files)
app.use('/public', express.static(path.join(__dirname, 'public')));

//listen to PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, console.log(`Server is running on port ${PORT}`));

//use express-validator (for validation)
const expressValidator = require('express-validator');
app.use(expressValidator());

//use body parser (get values sent by forms)
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

//get passport (for validation)
const passport = require('./utils/passport');

app.use(require('./utils/session'));

app.use(passport.initialize());
app.use(passport.session());

//set "isAuthenticated" for the handlebars file
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

//use routes
app.use('/', require('./routes/home'));
app.use('/register', require('./routes/register'));
app.use('/login', require('./routes/login'));
app.use('/profile', require('./routes/profile'));
app.use('/friends', require('./routes/friends'));
app.use('/groups', require('./routes/groups'));
app.use('/logout', require('./routes/logout'));
app.use('/getuserinfo', require('./routes/getuserinfo'));

//view engine setup
const hbs = require('./handlebars');
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

module.exports = app;
