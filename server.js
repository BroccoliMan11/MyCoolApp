//parse environment variables
require('dotenv').config();

//for combinding path strings
const path = require('path');
//create a server
const express = require('express');
const app = express();

//create websocket and link to server
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
require('./socketevents')(io);

//static folder
app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, console.log(`Server is running on port ${PORT}`));

//get express-validator
const expressValidator = require('express-validator');
app.use(expressValidator());

// //get body parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

// //get passport
const passport = require('./utils/passport');

app.use(require('./utils/session'));

app.use(passport.initialize());
app.use(passport.session());

//set "isAuthenticated" in handlebars files
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

// //use routes
// app.use(
//     require('./routes/home'),
//     //require('./routes/register'),
//     require('./routes/login'),
//     require('./routes/profile'),
//     require('./routes/friends'),
//     require('./routes/groups'),
//     require('./routes/logout'),
//     require('./routes/getuserinfo')
// );

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
