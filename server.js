// require functions
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

// require js files
const initializePassport = require("./passport-config");
const Contact = require("./models/contacts");

// require dev dependencies "dotenv"
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

// port that server runs on
const port = process.env.PORT || 3000;

// express app
const app = express();

// connect to mongoDB
// Mongoose Deprecation warning fixed
mongoose.set("strictQuery", true);
// app.listen waits until db is connected
const dbURL = process.env.EMP_DB;
mongoose
    .connect(dbURL)
    .then((result) => app.listen(port))
    .catch((err) => console.log(err));

// initialize passport authentication
initializePassport(
    passport,
    (username) => users.find((user) => user.username === username),
    (id) => users.find((user) => user.id === id)
);

// users array
const users = [];

// static files
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/img", express.static(__dirname + "public/img"));

// set views
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// get index (home) page
app.get("/", checkAuthenticated, (req, res) => {
    res.render("home.ejs", { username: req.user.username });
});

// get login page
app.get("/login", checkNotAuthenticated, async (req, res) => {
    const hashedPassword = await bcrypt.hash(process.env.USERS_PASSWORD, 10);
    users.push({
        id: Date.now().toString(),
        username: process.env.USERS_USERNAME,
        password: hashedPassword,
    });
    res.render("login.ejs");
});

app.post(
    "/login",
    checkNotAuthenticated,
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true,
    })
);

// delete back to log in page with log out
app.delete("/logout", function (req, res, next) {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    next();
}

// get schedules page
app.get("/schedules", checkAuthenticated, (req, res) => {
    res.render("schedules.ejs");
});

// get notifications page
app.get("/notifications", checkAuthenticated, (req, res) => {
    res.render("notifications.ejs");
});

// get notifications-success page
app.get("/notifications-success", checkAuthenticated, (req, res) => {
    res.render("notifications-success.ejs");
});

// connect notifications form to add to database
app.post("/notify", async (req, res) => {
    try {
        const contact = new Contact({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
        });
        contact.save();
        res.redirect("/notifications-success");
    } catch {
        res.redirect("/notifications");
    }
});

app.get("/all-emails", (req, res) => {
    Contact.find({}, { _id: 0, email: 1 })
        .then((result) => {
            res.send(result);
        })
        .catch((err) => {
            console.log(err);
        });
});
