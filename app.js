require('dotenv').config();
require('./config/database').connect();

const bcrypt = require('bcryptjs/dist/bcrypt');
const express = require('express');
const User = require('./model/user');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
var cookieParser = require('cookie-parser')
//mongoclient
// const { MongoClient } = require('mongodb');
// const { MONGO_URI } = process.env;
// const mongo_string = "mongodb://localhost:27017/mongotin";
// const client = new MongoClient(MONGO_URI);

const app = express();
app.use(express.json());
app.use(cookieParser());

// Login goes here
// Register
app.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        if (!(email && password && first_name && last_name)) {
            res.status(400).send("All input is required");
        }

        const oldUser = await User.findOne({ email: email.toLowerCase() });
        // console.log(MONGO_URI);
        // await client.connect();
        // console.log('Connected successfully to server');
        // const db = client.db("mongotin");
        // const filteredDocs = await db.collection('users').find({email:email}).toArray();
        // console.log('Found documents filtered by { a: 3 } =>', filteredDocs);

        // console.log(oldUser);
        if (oldUser) {
            return res.status(409).send("User already exist. Please login");
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name: first_name,
            last_name: last_name,
            email: email.toLowerCase(),
            password: encryptedPassword
        })

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h"
            })

        user.token = token;
        res.status(201).json(user);

    } catch (err) {
        console.log(err);
    }
})

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "10000" //2h
                })

            user.token = token;
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials")
    } catch (err) {

    }
})

app.post('/welcome', auth, (req, res) => {
    console.log(req.user);
    res.status(200).send('Welcome')
})

app.post('/test', auth, (req, res) => {
    console.log('Cookies: ', req.user)

  // Cookies that have been signed
    console.log('Signed Cookies: ', req.signedCookies)
    res.status(201).json(req.user);
})

module.exports = app;