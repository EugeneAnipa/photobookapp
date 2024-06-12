/* -------------------------------      Photobook app         ------------------------ */
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";

import morgan from "morgan";

import mysql from "mysql";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

var accessLogStream = fs.createWriteStream((__dirname, "access.log"), {
  flags: "a",
});
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan("combined", { stream: accessLogStream }));

import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import nocache from "nocache";

const saltRounds = 10;

app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 500 * 60 * 60,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(nocache());

app.set("etag", false);
const loginappdb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "loginapp",
});
loginappdb.connect();
app.get("/login", (req, res) => {
  console.log("this is the post login details" + req.match, req.user);
  res.render("login.ejs");
});

app.get("/dashboard", (req, res) => {
  console.log(" dashboard to work with " + req.user);
  //res.render("/dashboard.ejs");

  if (req.isAuthenticated()) {
    var hereUSer = req.user;
    var hereUSerSql = "SELECT * FROM login WHERE email = ?";

    console.log("here is the email" + req.user);
    console.log("here is hereUser " + hereUSer);

    loginappdb.query(hereUSerSql, [hereUSer], function (err, hereResult) {
      console.log(hereResult.length);
      for (let a = 0; a < hereResult.length; a++) {
        console.log(" first name inside for loop" + hereResult[a].firstname);
        console.log("inside for loop here is the email" + req.user);
        // res.render("dashboard.ejs", { UserMail: req.user });

        res.render("dashboard.ejs", { UserMail: req.user });
      }
      // res.render("dashboard.ejs", hereResult);
    });

    // res.render("dashboard.ejs", { UserMail: req.user });
  } else {
    res.redirect("/login");
  }
});

/*++++++++++++++++++++++++++++++++++ */
/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", async (req, res) => {
  var emailS = req.body.email;
  var passwordS = req.body.password;
  var firstname1 = req.body.firstname;
  var lastname1 = req.body.lastname;
  console.log("these are :" + emailS, passwordS, firstname1, lastname1);

  try {
    await loginappdb.query(
      "SELECT email FROM login WHERE email = ?",
      [emailS],
      function (err, result) {
        console.log(result.length);
        if (result.length > 0) {
          console.log("email already taken");
        } else {
          bcrypt.hash(passwordS, saltRounds, async (err, hash) => {
            if (err) {
              console.log("Error hashing password : ", err);
            } else {
              var sql =
                "INSERT INTO login(firstname,lastname,email,password) VALUES (?,?,?,?)";
              await loginappdb.query(
                sql,
                [firstname1, lastname1, emailS, hash],
                function (err, result) {
                  if (err) throw err;
                  console.log("data inserted");
                  res.redirect("/login");
                }
              );
            }
          });
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});
/*






*/

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

app.post("/logout", function (req, res, next) {
  res.clearCookie("connect.sid");
  req.logout(function (err) {
    req.session.destroy(function (err) {
      res.send();
      console.log("session destroyed");
    });

    res.redirect("/login");
  });
});

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

passport.use(
  new Strategy(
    {
      usernameField: "email1",
      passwordField: "password1",
      passReqToCallback: false,
    },
    async function verify(email1, password1, cb) {
      console.log(email1, password1);
      try {
        var emailSql = "SELECT email,password FROM login WHERE email = ? ";

        await loginappdb.query(
          emailSql,
          [email1],
          async function (err, result) {
            console.log(result.length);
            if (result.length > 0) {
              for (let a = 0; a < result.length; a++) {
                console.log(result[a].email);
                console.log(result[a].password);
                const user = result[a].email;

                const match = await bcrypt.compare(
                  password1,
                  result[a].password
                );
                console.log(match);

                if (match) {
                  if (err) {
                    //console.log(err);
                    return cb(err);
                  } else {
                    return cb(null, user);
                    console.log(cb);
                  }
                } else {
                  console.log("wrong password!!");
                  return cb(null, false);
                }
              }
            } else {
              console.log(cb);
              return cb(null, false);
              // return cb("user not found");
              // res.send("user not found!!");
              // console.log("user not found");
            }
          }
        );
      } catch (err) {
        console.log(err);
        return cb(err);
      }
    }
  )
);

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

app.post(
  "/login",

  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  }),
  function (req, res) {
    if ("/login") {
      console.log("this is the post login details" + req.match, req.result);
    }
  }
);

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});
console.log(passport);

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

/* -------------------------------               ------------------------ */

app.listen(3000, () => {
  console.log("server is running on 3000");
});