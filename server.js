//app setup
const express = require('express'); //npm i express
const app = express();
const PORT = process.env.PORT || 3000;

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

//use public css/js
app.use('/public', express.static('public'));

//view engine & handlebars setup
const handlebars = require('express-handlebars'); //npm i handlebars-express
app.set('view engine', 'hbs');
app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    extname: 'hbs',
    defaultLayout: 'index'
}));

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
                name: users[socket.id]
            }
        );
    })
    socket.on('disconnect', () => {
        // socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    })
});

module.exports = app;









