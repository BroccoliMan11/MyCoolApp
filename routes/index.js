const express = require('express'); //npm i express
const app = express.Router();

require('dotenv').config();

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
        /*console.log(username);
        console.log(password);*/
        
        firebase.database().ref("users/").orderByChild("username")
        .equalTo(username).once("value",snapshot => {
            if (!snapshot.exists()){
                done(null, false);
            }else{
                user_id = Object.keys(snapshot.val());
                const hash = snapshot.val()[user_id].password;
    
                bcrypt.compare(password, hash, (err, res) => {
                    if (res){
                        return done(null, {user_id: user_id});
                    }else{
                        return done(null, false);
                    }
                });
            }
        });     
    }
));

//ROUTES

async function getUserInfo(user_id){
    let user;
    await firebase.database().ref("users/").orderByKey()
    .equalTo(user_id).once("value", snapshot => {
        user = snapshot.val()[user_id];
    });
    return user;
}

app.get('/userinfo', async (req, res) => {
    const user_id = req.user.user_id[0];
    const userInfo = await getUserInfo(user_id);
    res.json(userInfo);
});

app.get('/register', (req, res) => {
    res.render('register', {title: "Registration"});
});

app.get('/', (req, res) => {
    /*console.log(req.user);
    console.log(req.isAuthenticated());*/
    res.render('home', {title: "Home"});
});

app.get('/profile', authenticationMiddleware(), async (req, res) => {
    const user_id = req.user.user_id[0];
    const userInfo = await getUserInfo(user_id);
    res.render(
        'profile', 
        {
            title: "Profile", 
            username: userInfo.username, 
            password: /*userInfo.password*/ "Oops! Can't show that!" 
        }
    );
});

app.get('/chat', authenticationMiddleware(), (req, res) => {
    res.render('chat', {chat: true, title: 'Chat'});
});

app.get('/login', (req, res) => {
    res.render('login', {title: "Login"});
});

app.post('/login', passport.authenticate(
    'local', {
        successRedirect: '/profile',
        failureRedirect: '/login'
    }
));

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

    await firebase.database().ref("users/").orderByChild("username")
    .equalTo(username).once("value", snapshot =>{
        if(snapshot.exists()){
            allErrors.push(
                {
                    location: 'body',
                    param: 'username', 
                    msg: 'Username already exists', 
                    value: ''
                }
            );
        }
    });

    if (allErrors[0]){
        res.render(
            'register', 
            {title: 'Registration Error', 
            errors: allErrors
            }
        );
    }else{
        await bcrypt.hash(password, saltRounds, (err, hash) => {
            firebase.database().ref("users/").push(
                {
                    username: username,
                    password: hash
                }
            )

            firebase.database().ref("users/")
            .once("child_added", childSnapshot => {
                const user_id = childSnapshot.key;
                req.login(user_id, err => {
                    res.redirect("/");
                });
            });   
        });
    }
});

passport.serializeUser((user_id, done) => {
    done(null, user_id);
});

passport.deserializeUser((user_id, done) => {
    done(null, user_id);
});

function authenticationMiddleware(){
    return (req, res, next) => {
        /*console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);*/
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    };
}

module.exports = app;