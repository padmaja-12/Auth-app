var express               = require('express'),
    passport              = require("passport"),
    localStrategy         = require("passport-local"),
    mongoose              = require('mongoose'),
    bodyParser            = require("body-parser"),
    passportLocalMongoose = require('passport-local-mongoose'),
    Strategy              = require('passport-facebook').Strategy,
    app                   = express();
    
    require('dotenv').config();
    
    mongoose.connect('mongodb://localhost/MyDatabase',
      { useNewUrlParser: true, useUnifiedTopology: true });
    
    const Schema = mongoose.Schema;
    const UserDetail = new Schema({
      username    : String,
      email       : String,
      facebook_id : String,
      image       : String,
      password    : String
    });
    
    UserDetail.plugin(passportLocalMongoose);
    const User = mongoose.model('userInfo', UserDetail, 'userInfo');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(require("express-session")({
    secret: "I love my mummy!!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(function(user, cb) {
    cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
   cb(null, obj);
});

// Configure the Facebook strategy for use by Passport.
passport.use(new Strategy({ //This is class constructor argument telling Passport to create a new Facebook Auth Strategy
    clientID: "972809976567969",//The App ID generated when app was created on https://developers.facebook.com/
    clientSecret: "101bb48dc20e28abd52184b1a62613a9",//The App Secret generated when app was created on https://developers.facebook.com/
    callbackURL: 'http://localhost:3000/return',
    profile: ['id', 'displayName','photos', 'email'],
    enableProof: true // You have the option to specify the profile objects you want returned
  },
  function(accessToken, refreshToken, profile, done) {
    //Check the DB to find a User with the profile.id
    User.findOne({ facebook_id: profile.id , username : profile.username}, function(err, user) {//See if a User already exists with the Facebook ID
      if(err) {
        console.log(err);  // handle errors!
      }
      
      if (user) {
       return done(null, user); //If User already exists login as stated on line 10 return User
      } else { 
        User.register(new User({facebook_id: profile.id,username : profile.displayName,image : profile.photos,email : profile.email}),(err,user) => { //Save User if there are no errors else redirect to login route
          if(err) {
            res.redirect("/login/facebook");  // handle errors!
          } else {
           return done(null, user);
          }
        });
      }
    });
  }
));

app.get("/",(req,res) => {
    res.render("landing");
})


app.get("/register", (req,res) => {
    res.render("Authentication/register");
})

app.get("/main",(req,res) => {
    console.log(req.user);
    res.render("main");
})


app.post("/register",(req,res) => {
    //console.log(req.body);
    User.register(new User({username: req.body.username,email: req.body.email}), req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        if(user) {
            done(null, user);
        }
        passport.authenticate("local",{ failureRedirect: '/register' })(req, res, function(){
            res.redirect("/main");
        });
    });
})

app.get("/login",(req,res) => {
    res.render("Authentication/login");
})

app.post("/login",passport.authenticate("local", {
    successRedirect: "/main",
    failureRedirect: "/login"
}),(req,res) => {});

app.get('/login/facebook', passport.authenticate('facebook',{ authType: 'reauthenticate'}));

app.get('/return',passport.authenticate('facebook', {          
    failureRedirect: '/' }),(req,res) => {
        res.redirect("/main");
})

app.listen(process.env.PORT || 3000 ,(req,res) => {
    console.log("You have been connected to port 3000");
})


