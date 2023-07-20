require('dotenv').config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs= require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const LocalStrategy=require('passport-local').Strategy;

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
    password:String
});

userSchema.plugin(passportLocalMongoose);

const User= new mongoose.model("User",userSchema);

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/",async(req,res)=>{
    res.render("home");
});

app.get("/login",async(req,res)=>{
    res.render("login");
});

app.get("/register",async(req,res)=>{
    res.render("register");
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