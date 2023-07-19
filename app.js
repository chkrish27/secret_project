require('dotenv').config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs= require("ejs");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const saltRounds = 10;

const app=express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://0.0.0.0:27017/userdb');
}

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});


const User= new mongoose.model("User",userSchema);


app.get("/",async(req,res)=>{
    res.render("home");
});

app.get("/login",async(req,res)=>{
    res.render("login");
});

app.get("/register",async(req,res)=>{
    res.render("register");
});

app.post("/register",async(req,res)=>{
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        const newUser=new User({
            email:req.body.username,
            password:hash
          });
          newUser.save().then(result => {
              res.render("secrets");
            }).catch(error => {
              console.log(error);
            });
    });
    
});

app.post("/login", async (req, res) => {
    const userName = req.body.username;
    const password = bcrypt.hash(req.body.password,saltRounds);
    try {
      const foundUser = await User.findOne({ email: userName });
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("secrets");
        } else {
          res.send("Incorrect password.");
        }
      } else {
        res.send("Match not found.");
      }
    } catch (error) {
      res.send(error);
    }
  });

app.listen(3000,function(){
    console.log("Server started at port 3000");
});