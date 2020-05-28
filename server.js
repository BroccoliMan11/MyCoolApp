//app setup
const express = require('express'); //npm i express
const app = express();
const PORT = process.env.PORT || 3000;

//error handling packages
const createError = require('http-errors');

const cookieParser = require('cookie-parser');
const logger = require('morgan');

//socket setup
const http = require('http').Server(app); 
const io = require('socket.io')(http);  //npm i socket.io
http.listen(PORT, console.log(`listening at port ${PORT}`));

//reference routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

//use server routes
app.use('/', indexRouter);
app.use('/user', usersRouter);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//use public css/js
app.use('/public', express.static('public'));

//view engine & handlebars setup
const exphbs = require('express-handlebars'); //npm i handlebars-express
//const hbshelpers = require('handlebars-helpers'); //npm i handlebars-helpers
//const multihelpers = hbshelpers();

const hbs = exphbs.create({
    helpers: require('./hbs-helpers'),
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    extname: 'hbs',
    defaultLayout: 'index'
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

//catch 404
app.use((req, res, next) => {
    next(createError(404));
});

app.use((err, req, res, next) => {
    //error messages in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

        console.log(res.locals.error);

    //render error page
    res.render('error', {layout: false});
});

const users = {}

io.on('connection', socket => {
    socket.on('new-user', user => {
        users[socket.id] = user.username;
        // socket.broadcast.emit('user-connected', user.username);
    })
    socket.on('send-chat-message', message => {
        socket.broadcast.emit(
            'chat-message',    
            {
                message: message, 
                username: users[socket.id]
            }
        );
    })
    socket.on('disconnect', () => {
        // socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    })
});

module.exports = app;









