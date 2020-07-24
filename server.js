//parses environment variables
require('dotenv').config(); 

//for combining path strings
const path = require('path'); 

//create a server
const express = require('express');
const app = express(); 

//static folder (client files)
app.use('/public', express.static(path.join(__dirname, 'public')));

//use express-validator (for validation)
const expressValidator = require('express-validator');
app.use(expressValidator());

//use body parser (get values sent by forms)
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

//get passport (for validation)
const passport = require('./utils/passport');

const session = require('express-session');
const db = require('./database');
const FirebaseStore = require('connect-session-firebase')(session);

//initialize session middleware
const sessionMiddleware = session({
    store: new FirebaseStore({
        database: db,
    }),
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

//create websocket and link to server
const http = require('http');
const server = http.createServer(app);
require('./socketevents').initalizeSocketIO(server, sessionMiddleware);

//listen to PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, console.log(`Server is running on port ${PORT}`));

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
