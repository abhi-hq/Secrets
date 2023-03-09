require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");

const saltRounds = 10;

const app=express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.set('strictQuery',true);
mongoose.connect("mongodb://127.0.0.1:27017/UserDB",{useNewUrlParser: true, useUnifiedTopology: true}); 

const userschema=new mongoose.Schema({
    email:String,
    password:String
})



const User=new mongoose.model("User",userschema);

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/register",(req,res)=>{
    res.render("register");
})

app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(!err)
        {const newuser=new User({
            email:req.body.username,
            password:hash
        })
    
        newuser.save().then(()=>{
            res.render("secrets");
        }).catch((err)=>{
            console.log(err);
        }) }
        else
        console.log(err);
    });
})

app.post("/login",(req,res)=>{
    User.findOne({email:req.body.username}).then((found)=>{
        if(found){
               bcrypt.compare(req.body.password,found.password, (error,result)=>{
                if(result===true)
                res.render("secrets");
            })
        }
    }).catch((err)=>{
        console.log(err)
    })
})

app.listen(3000,()=>{
    console.log("Server at port 3000 started");
})