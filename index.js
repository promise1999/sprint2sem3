const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');

const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'agent',
    host: 'localhost',
    database: 'sprint2',
    password: 'password',
    port: 5432
});

const app = express()

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}));

app.use(session({secret: "password"}));

app.get("/", function(req, res){
   if(req.session.count === undefined){
        req.session.count = 0
    }

    const count = req.session.count;
    req.session.count = req.session.count + 1
    res.send(`you've visited 2 times before!`)
})

app.get('/signup', function(req, res){
    res.sendFile(path.join(__dirname, 'signup.html'))
})

app.post('/signup', async function(req, res){
    let email = res.body.email;
    let password = res.body.password;
    let encrypted_password = await bcrypt.hash(password , 10);
    let results = await Pool.query('SELECT * FROM users where email=$1',[email])
    if(results.rows.length > 0){
        res.send("Error! There is already an account with that name! Try again")
    }else{
        let insert_result = await Pool.query('INSERT INTO users(email, password) VALUES ($1, $2', [email, encrypted_password])
        res.send("Account has been Created!")
    }
})

app.get("/login", function(req, res){
    res.sendFile(path.join(__dirname, 'login.html'))
})

app.post("/login", async function(req, res){
    const email = req.body.email;
    const password = req.body.password;
    let results = await pool.query('SELECT * FROM users where email=$1',[email]);
    if(results.rows.length < 1){
        res.send("Error! account already exist with that name! Try again")
    }else if(results.rows > 1){
        console.warn("There are two account with same email! try with a different email! ")
        res.send("Ooop! Your logged in failed due to multiple accounts! Try with another account!  ")
    }else{
        if(bcrypt.compare(password, results.rows[0].password)){
            req.session.loggedIn = true;
            res.send("you've loggin Successfully! ")
        }else{
            res.send("invalid password! Try again! ")
        }
    }
});

app.get("/secret", function(req,res){
    if(req.session.loggedIn === true){
        res.send("wow! You are allow to be here")
    }else{
        res.send("Ooop! You are not logged in!")
    }
});
app.listen(3000, function(){
    console.log("listening at http://localhost:3000")
})