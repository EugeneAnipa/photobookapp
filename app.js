/* -------------------------------      Photobook app         ------------------------ */
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";

import morgan from "morgan";

import mysql from "mysql";
import mysql2 from "mysql2/promise";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import nocache from "nocache";
import multer from "multer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

var accessLogStream = fs.createWriteStream((__dirname, "access.log"), {
  flags: "a",
});

//just noticed i did not place the ejs set here, but it was still working
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan("combined", { stream: accessLogStream }));

const saltRounds = 10;

app.use(
  session({
    secret: process.env.SESSIONSECRET,
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
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
});
loginappdb.connect();

/** mysql2 db */
const loginappdb2 = await mysql2.createConnection({
  host: process.env.MYSQL2HOST,
  user: process.env.MYSQL2USER,
  database: process.env.MYSQL2DATABSE,
  password: process.env.MYSQL2PASSWORD,
});
/**      mysql2 db */

var seecret = process.env.CLOUDINARYAPISECRET;
cloudinary.config({
  cloud_name: process.env.CLOUDINARYCLOUDNAME,
  api_key: process.env.CLOUDINARYAPIKEY,
  api_secret: seecret,
  secure: true,
});

//CLOUDINARY_URL=cloudinary://169418963869343:Eq5mQpc2JHG8dwOlnMFdrXvV6HU@da7nhb6yj
//Eq5mQpc2JHG8dwOlnMFdrXvV6HU
const upload = multer();

//after the make app post profile a function, app dot use it , then call it dashboard
//you get document query selector and update the profile photo when changed and not the whole page rendering to change

app.post("/profile", upload.single("avatar"), async function (req, res) {
  // Upload an image

  console.log(req.file);
  var tyfile = req.file;
  console.log(typeof tyfile);
  console.log("email here " + req.user);
  /****************** */
  const uploadResult = cloudinary.uploader
    .upload_stream(
      {
        resource_type: "image",
        asset_folder: "profilephotos",
        public_id: req.user + "_" + "avatar",
        overwrite: true,
        unique_filename: true,
      },
      function (error, result) {
        console.log(error);
        console.log(result);

        var secureUrlSQL = "UPDATE login SET avatar= ?  WHERE email = ? ";
        loginappdb.query(
          secureUrlSQL,
          [result.secure_url, req.user],
          function (err, inREsult) {
            console.log("secure url inserted");
          }
        );
      }
    )
    .end(req.file.buffer);

  res.redirect("/dashboard");

  /**************************  */
  /*
  //the below code is to upload image via a url link , so you change req.file to the url
  const uploadResult = await cloudinary.uploader
    .upload(req.file, {
      resource_type: "image",
      asset_folder: "profilephotos",
      public_id: req.user + "avatar",
      overwrite: true,
      unique_filename: true,
    })
    .catch((error) => {
      console.log(error);
    });

  res.send("complete");
  console.log(uploadResult);
  */
  //save the imageurl to db
  // var imageurl = json(uploadResult.secure_url);
  //console.log(imageurl);
});

//bug alert!! on the frontend, when you click on add photo, without uploading, it takes you an error thats says can not read buffer, so you have write a code, if buffer empty, redirects to dashboard, or easy way , just solve it at the frontend by placing the required html attribute for both the profile photo and adding photos, html attribute was used, solver here by using try and catch block

app.post("/addphoto", upload.single("photo"), async function (req, res) {
  //upload.single("photo")
  //
  //
  console.log(req.file.buffer);
  const photoUpload = await cloudinary.uploader
    .upload_stream(
      {
        resource_type: "image",
        asset_folder: "displayphotos",

        unique_filename: true,
        public_id: req.body.photoname,
      },
      function (error, result) {
        //2nd parameter is result.
        console.log(error);
        //console.log(result);

        loginappdb.query(
          "INSERT INTO imagephotos(photos,email,publicid) Values(?,?,?)",
          [result.secure_url, req.user, req.body.photoname],
          function (err, inREsult) {
            console.log("photo secure url inserted");
          }
        );
        //return result;
      }
    )
    .end(req.file.buffer);
  photoUpload;

  console.log({ ...photoUpload });
  console.log(photoUpload);

  res.redirect("/dashboard");
});

/**     */

/** */

app.get("/login", (req, res) => {
  console.log("this is the post login details" + req.match, req.user);

  /* res.locals.login = login;
  
  
   trying to solve the header issue
  **/
  res.locals.Wrong = "";
  res.locals.login;

  res.render("login.ejs");
});

app.get("/dashboard", async function (req, res) {
  console.log(" dashboard to work with " + req.user);
  //res.render("/dashboard.ejs");
  console.log(req.isUnauthenticated());
  console.log(req.isAuthenticated());
  console.log(req.isPaused());

  if (req.isUnauthenticated) {
    console.log("not login");
  }

  if (req.isAuthenticated()) {
    var hereUSer = req.user;
    var hereUSerSql = "SELECT * FROM 'login' WHERE 'email' = ?";
    var imageSql = "SELECT * FROM imagephotos WHERE email = ?";
    var displayResultSql =
      " SELECT login.email AS email,login.firstname as firstname ,login.avatar as avatar,imagephotos.photos as photos  FROM login INNER JOIN imagephotos ON login.email=imagephotos.email WHERE login.email= ? ";
    var bothProfileandAddPhotos =
      "SELECT * FROM login INNER JOIN imagephotos ON login.email=imagephotos.email WHERE login.email = ? ";
    console.log("here is the email" + req.user);
    console.log("here is hereUser " + hereUSer);

    try {
      const [rows] = await loginappdb2.query(
        "SELECT * FROM login WHERE email = ?",
        [req.user]
      );
      const [photoresult] = await loginappdb2.query(
        "SELECT * FROM imagephotos WHERE email = ?",
        [req.user]
      );

      console.log(rows[0].firstname);

      res.locals.displayPhotos = photoresult;

      res.locals.dashboard;

      for (let a = 0; a < photoresult.length; a++) {
        console.log(photoresult[a].photos);
        // res.locals.displayPhotos = photoresult[a].photos;
      }

      res.render("dashboard.ejs", {
        UserAvatar: rows[0].avatar,
        UserEmail: rows[0].email,
        UserFirstname: rows[0].firstname,
      });
    } catch (err) {
      console.log(err);
    } finally {
      // loginappdb2.close();
    }

    /**mysql2 try and catch block */
  } else if (req.isUnauthenticated()) {
    res.redirect("/login");
    console.log("test this wrong login");
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
  /* res.locals.signup = signup;
  
  
   trying to solve the header issue
  **/
  //res.locals.signup = signup;
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

app.post("/delete/:id", async function (req, res) {
  //try getting the value thus url and pass in to delete
  //if that how do you delete in db without the id ?
  //get id from the frontend value,then query select db to get da url,
  //then pass that url to cloudinary to destroy,then use the id to
  // from db now

  const value = req.params.id;
  console.log("this is " + value);

  const [publicidSelect] = await loginappdb2.query(
    "SELECT * from imagephotos WHERE email = ? AND ID = ?",
    [req.user, value]
  );
  console.log(" url here  " + publicidSelect[0].publicid);
  const publicidSelected = publicidSelect[0].publicid;
  /*
  cloudinary.v2.api
    .delete_resources(["ohqaubdln9isze7nlwof"], {
      type: "upload",
      resource_type: "image",
    })
    .then(console.log);
*/

  cloudinary.uploader
    .destroy(publicidSelected, { asset_folder: "displayphotos" })
    .then((result) => console.log(result));

  const deLete = await loginappdb2.query(
    "DELETE FROM imagephotos WHERE email =?  AND ID=?;",
    [req.user, value]
  );

  res.redirect("/dashboard");
});
/*






*/

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */
app.get("/logout", function (req, res) {
  res.redirect("/login");
});

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
                //const UserFirstname = result[a].firstname;
                // console.log("passport side " + UserFirstname);

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
                    //console.log(cb);
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

app.get("/failureLogger", function (req, res) {
  if (req.isUnauthenticated()) {
    // set timer function here maybe at the front end or
    //breadcrumbs to cancel it
    /*

    res.locals.Wrong = "Wrong Login details";
    res.render("login");
    */
    res.locals.Wrong = "Wrong Login details";
    let html = `<p  hx-swap="outerHTML" hx-target="this"><%= Wrong %></p>`;

    res.render("login", (err, html) => {
      res.send(html);
    });
  }

  console.log(req.isAuthenticated());
  console.log(req.isUnauthenticated());
});

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

/*    ++++++++++++++++++++++++++++++++++++ */

/*++++++++++++++++++++++++++++++++++ */

app.post(
  "/login",

  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/failureLogger",
  }),
  function (req, res) {
    if ("/login") {
      console.log("this is the post login details " + req.match, req.result);
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
//console.log(passport);
console.log(cloudinary);
//console.log(upload);

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
console.log(bcrypt);
console.log(passport);
app.listen(8000, () => {
  console.log("server is running on 8000");
});
