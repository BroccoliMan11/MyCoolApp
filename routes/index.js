const express = require('express'); //npm i express
const app = express.Router();

require('dotenv').config(); //npm i dotenv

//sessions
const session = require('express-session'); //npm i express-session
const FirebaseStore = require('connect-session-firebase')(session); //npm ifirebase-admin connect-session-firebase

//hashing
const bcrypt = require('bcrypt'); //npm i bycrypt
const saltRounds = 10;

//body parser
const bodyParser = require('body-parser'); //npm i body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

//validation
const expressValidator = require('express-validator'); //npm i express-validator
app.use(expressValidator());

//authentication
const passport = require('passport'); //npm i passport
const LocalStrategy = require('passport-local').Strategy; //npm i passport-local

//database reference
const firebase = require('../database');

//use session
app.use(session({
    store: new FirebaseStore({
        database: firebase.database()
    }),
    secret: 'hdakhdewkfsdnbhjsegyw',
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

passport.use(new LocalStrategy(
    (username, password, done) => {
        firebase.database().ref('users/').orderByChild('username')
        .equalTo(username).once('value',snapshot => {
            if (!snapshot.exists()){
                done(null, false);
            }else{
                const user_id = Object.keys(snapshot.val())[0];
                const user = snapshot.val()[user_id];
                const hash = user.password;
    
                bcrypt.compare(password, hash, (err, res) => {
                    if (res){
                        return done(null, user);
                    }else{
                        return done(null, false);
                    }
                });
            }
        });     
    }
));

//ROUTES
app.get('/userinfo', (req, res) => {
    res.json(req.user);
});

app.post('/messagecheck/:message', (req, res) => {
    const message = req.params.message;
    if (message.trim() === '') return res.json(false);
    if (message.length > 2000) return res.json(false);
    res.json(true);
});

app.get('/register', (req, res) => {
    res.render('register', {page: 'register'});
});

app.get('/', (req, res) => {
    /*console.log(req.user);
    console.log(req.isAuthenticated());*/
    res.render('home', {page: 'home'});
});

app.get('/profile', authenticationMiddleware(), async (req, res) => {
    const user = req.user;
    res.render(
        'profile', 
        {
            page: 'profile',
            username: user.username, 
            password: user.password
        }
    );
});

app.get('/chat', authenticationMiddleware(), (req, res) => {
    res.render('chat', {chat: true, page: 'chat'});
});

app.get('/login', (req, res) => {
    res.render('login', {page: 'login'});
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) console.error(err);
        if (!user) {
            console.log('yes there is no user');
            let allErrors = [];
            allErrors.push( { location: 'body', param: '', msg: 'Username or Password is Incorrect!', value: ''});
            console.log(allErrors);
            return res.render('login', {page: 'login', errors: allErrors});
        } 
        req.login(user, err => {
            if (err) console.error(err);
            return res.redirect('/');
        });
    })(req, res, next);
});

app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy(() => {
        res.redirect('/');
    });  
});

app.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('password', 'Password must be between 8-100 characters').len(8, 100);
    req.checkBody('password', 'Password must include one lowercase character, one uppercase character, a number, and a special character')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/, "i");
    req.checkBody('passwordMatch', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(password);

    let validateErrors = req.validationErrors();
    let allErrors = [];

    for (let i = 0; i < validateErrors.length; i++){
        const error = validateErrors[i];
        allErrors.push(error);
    }

    await firebase.database().ref('users/').orderByChild('username')
    .equalTo(username).once('value', snapshot =>{
        if(snapshot.exists()){
            allErrors.push(
                { location: 'body', param: 'username', msg: 'Username already exists', value: ''}
            );
        }
    });

    if (allErrors[0]){
        res.render('register', {page: 'registration error', errors: allErrors});
    }else{
        await bcrypt.hash(password, saltRounds, (err, hash) => {
            firebase.database().ref('users/').push(
                { username: username, password: hash }
            );

            firebase.database().ref('users/').once('child_added', childSnapshot => {
                const user = childSnapshot.val();
                req.login(user, err => { 
                    res.redirect('/'); 
                });
            });   
        });
    }
});

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

function authenticationMiddleware(){
    return (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    };
}

module.exports = app;