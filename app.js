require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption")

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


userschema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});

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
    const newuser=new User({
        email:req.body.username,
        password:req.body.password
    })

    newuser.save().then(()=>{
        res.render("secrets");
    }).catch((err)=>{
        console.log(err);
    })
})

app.post("/login",(req,res)=>{
    User.findOne({email:req.body.username}).then((found)=>{
        if(found){
            if(found.password===req.body.password)
            res.render("secrets");
        }
    }).catch((err)=>{
        console.log(err)
    })
})

app.listen(3000,()=>{
    console.log("Server at port 3000 started");
})