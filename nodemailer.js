if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const nodemailer = require("nodemailer");
const Contact = require("./models/contacts");
const mongoose = require("mongoose");
const hbs = require("nodemailer-express-handlebars");
const dbURL = process.env.EMP_DB;
mongoose.connect(dbURL);

// setting up the nodemailer
//step 1
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
    },
});

transporter.use(
    "compile",
    hbs({
        viewEngine: "express-handlebars",
        viewPath: "",
    })
);

// step 2
let mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: "trentward02@gmail.com",
    subject: "Testing Nodemailer",
    template: "main",
};

// step 3
transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log("Email sent!!!");
    }
});

// send emails by running "node nodemailer.js" in command line
