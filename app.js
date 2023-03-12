require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate")
/*level 2 just using mongoose-encryption, that is secret key, then .env to put it in environment variables
then Level 3 hashing the password by md5
then level 4 bcrypt: salt+hashing password
then Level 5 using passport js to authenticate, passportlocalmongoose to form salt+hash password*/



const app=express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret:"another secret key",
    resave: false,
    saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery',true);
mongoose.connect("mongodb://127.0.0.1:27017/UserDB",{useNewUrlParser: true, useUnifiedTopology: true}); 

const userschema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})

userschema.plugin(passportlocalmongoose);
userschema.plugin(findOrCreate);

const User=new mongoose.model("User",userschema);

passport.use(User.createStrategy());

passport.serializeUser((user,done)=>{
    done(null,user.id);
}); //that is store user id i.e create cookie through out the session
passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(err,user);
    })
}); // when session is over i.e logout happens, the user data of the id is available to authenticate by passport.

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
 passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
    //successful authentication redirect to secrets page
  res.redirect("/secrets");
});

app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/secrets",(req,res)=>{
    User.find({secret:{$ne:null}},(err,found)=>{
        if(err)
        console.log(err)
        else
        {   if(found)
            res.render("secrets",{userswithsecrets:found})
        }
    })
})

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(!err)
        res.redirect("/");
    });
})

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated())
    res.render("submit");
    else
    res.redirect("/login")
})

app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.post("/login",(req,res)=>{

    const user = new User({
    username:req.body.username,
    password:req.body.password
    })

    req.login(user, (err)=>{
        if(err)
        console.log(err);
        else
        {passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })}
    })
})

app.post("/submit",(req,res)=>{
    const secretsubmitted=req.body.secret;

    User.findById(req.user.id,(err,founduser)=>{
        if(err)
        console.log(err);
        else
        if(founduser){
            founduser.secret=secretsubmitted;
            founduser.save((err)=>{
                if(!err)
                res.redirect("/secrets");
                else
                console.log(err);
            })
        }
    })
})


app.listen(3000,()=>{
    console.log("Server at port 3000 started");
})