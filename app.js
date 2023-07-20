require('dotenv').config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs= require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const LocalStrategy=require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const findOrCreate=require("mongoose-findorcreate");

const app=express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());  

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://0.0.0.0:27017/userdb');
}

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= new mongoose.model("User",userSchema);

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id).then(user => {
        done(null, user);
    }).catch(error => {
        done(error);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    scope:
    [ 'https://www.googleapis.com/auth/userinfo.profile',' https://www.googleapis.com/auth/userinfo.email' ],
    passReqToCallback:true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
  }
));

app.get("/",async(req,res)=>{
    res.render("home");
});

app.get('/auth/google' , passport.authenticate('google', { scope:
    [ 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email' ]
}));
  
// Auth Callback
app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        failureRedirect: '/login'}),function(req,res){
            res.redirect("/secrets");
        }
);

// app.get('/auth/callback/success' , (req , res) => {
//     if(!req.user)
//         res.redirect('/auth/callback/failure');
//     res.redirect('secrets');    
// });
  
// failure
app.get('/auth/callback/failure' , (req , res) => {
    res.send("Error");
})

app.get("/login",async(req,res)=>{
    res.render("login");
});

app.get("/register",async(req,res)=>{
    res.render("register");
});

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.get("/secrets",async(req,res)=>{
    if(req.isAuthenticated()){
    res.render("secrets");
    }
    else
    {
        res.redirect("/login");
    }
});

app.post("/register",async(req,res)=>{
   User.register({username: req.body.username},req.body.password,function(err,user)
   {
    if(err){
        console.log(err);
        res.redirect("/register")
    } else{
        passport.authenticate("local")(req,res,function(){
           res.redirect("/secrets");
        });
    }
   });
    
});

app.post("/login", async (req, res) => {
    const user =new User({
        username: req.body.username,
        password: req.body.password
    });
    req.logIn(user,function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
               res.redirect("/secrets");
            });
        }
    });
  });

app.listen(3000,function(){
    console.log("Server started at port 3000");
});