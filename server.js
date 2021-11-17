if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}

const port = process.env.PORT || 3000;

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

// initialize passport authentication
const initializePassport = require("./passport-config");
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
app.delete("/logout", (req, res) => {
	req.logOut();
	res.redirect("/login");
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

app.listen(port);
