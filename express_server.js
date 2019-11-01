const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

const {generateRandomString, checkUserByEmail, findUserByEmail, findUserURL, findLongURL} = require('./helpers');

const bcrypt = require('bcrypt');

const aes256 = require('aes256');
const key = 'sherry';

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name:'session',
  keys: ['sherry'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.set("view engine", "ejs");

const users = {
  "e2yh32gdTnuPchcElCmV+S6ZIKQ9x7mkxq0YMA==": {
    id: "e2yh32gdTnuPchcElCmV+S6ZIKQ9x7mkxq0YMA==",
    email: "user@example.com",
    password: "$2b$10$f9ETSYlgdTFV53vpYMWjG.epNDqxBEIJWvKPfTZVowKtTp0wJYYX6"
  },
  "Sw5Rg2O2Sa5Vimm8HTcwZ/QpNKbXnutYJxuXmKc=": {
    id: "Sw5Rg2O2Sa5Vimm8HTcwZ/QpNKbXnutYJxuXmKc=",
    email: "user2@example.com",
    password: "$2b$10$yrRsbjMU6.9z1WhUaqGh0OUtx51oC9NdZj7fIXaGIOAJ/DuLIoozi"
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "e2yh32gdTnuPchcElCmV+S6ZIKQ9x7mkxq0YMA==" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "Sw5Rg2O2Sa5Vimm8HTcwZ/QpNKbXnutYJxuXmKc=" }
};

//---------------------------------------------------------------------------------------//

//Website defaut, login/register pages

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls");
  } else {
    res.render("urls_register",{ userID: req.session.user_ID });
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", {userID: null});
  }
});

/*User registration endpoints.
  Handling error such as:
    - Register with empty email/password, existed email address
    - Log in with email that is not in database
*/

app.post("/register", (req, res) => {
  let templateVars = {
    userID: req.session.user_ID,
    email: req.session.email
  };
  if (req.body.email === "" || req.body.password === "") {
    templateVars["message"] = "Incorrect password/username format";
    res.render("urls_error", templateVars);
  } else if (checkUserByEmail(req.body.email, users)) {
    templateVars["message"] = "Email existed. Process to login";
    res.render("urls_error", templateVars);
  } else {
    const userID = aes256.encrypt(key, generateRandomString());
    const hashedPassword = bcrypt.hashSync(req.body.password, 5);
    req.session.user_ID = userID;
    req.session.email = req.body.email;
    users[userID] = {
      id: userID,
      ...req.body
    };
    users[userID].password = hashedPassword;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const userID = findUserByEmail(req.body.email, users);
  if (userID === "") {
    let templateVars = {
      userID: userID,
      email: req.session.email,
      message: "Incorrect email address."
    };
    res.render("urls_error", templateVars);
  } else {
    if (bcrypt.compareSync(req.body.password, users[userID].password)) {
      req.session.user_ID = userID;
      req.session.email = users[userID].email;
      res.redirect("/urls");
    } else {
      let templateVars = {
        userID: req.session.user_ID,
        email: req.session.email,
        message: "Incorrect password/username. Please try again!"
      };
      res.render("urls_error", templateVars);
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// Specific User features - List of URLs 

app.get("/urls", (req, res) => {
  let templateVars = {
    userID: req.session.user_ID,
    email: req.session.email,
    urlDatabase:findUserURL(req.session.user_ID, urlDatabase)
  };
  if (req.session.user_ID) {
    res.render("urls_index", templateVars);
  } else {
    templateVars["message"] = "Please login or register";
    res.render("urls_error", templateVars);
  }
});

// Add/Delete/Edit URL - Handling error when non-users or another users access to the links

app.get("/urls/new", (req, res) => {
  if (req.session.user_ID) {
    res.render("urls_new", {userID: req.session.user_ID, email: req.session.email});
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_ID) {
    let newURL = `${generateRandomString()}`;
    urlDatabase[newURL] = {longURL: req.body.longURL, userID: req.session.user_ID};
    res.redirect(`/urls/${newURL}`);
  } else {
    let templateVars = {
      userID: req.session.user_ID,
      email: req.session.email,
      message: "You do not have access to create shortURL"
    };
    res.render("urls_error", templateVars);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_ID && req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send("Sorry! You do not have access to delete this link");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_ID) {
    res.redirect(`/urls/${req.params.shortURL}`);
  } else {
    res.send("No access. Please login to edit the link");
  }
});

app.post("/u/:shortURL", (req, res) => {
  if (req.session.user_ID && req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.redirect("/u/:shortURL");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    userID: req.session.user_ID,
    email: req.session.email,
  }
  if (!(`${req.params.shortURL}` in urlDatabase)) {
    templateVars["message"] = "Incorrect URL"
    res.render("urls_error", templateVars);
  } else {
    if (req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
      templateVars["shortURL"] = req.params.shortURL;
      templateVars["longURL"] = urlDatabase[req.params.shortURL].longURL;
      res.render("urls_show", templateVars);
    } else {
      templateVars["message"] = "You do not have access to this link";
      res.render("urls_error", templateVars);
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!findLongURL(shortURL, urlDatabase)) {
    let templateVars = {
      userID: req.session.user_ID,
      email: req.session.email,
      message: "Your shortenURL is incorrect"
    };
    res.render("urls_error", templateVars);
  } else {
    let longURL = findLongURL(shortURL, urlDatabase);
    if (longURL.indexOf('http') === 0) {
      res.redirect(longURL);
    } else {
      res.redirect("http://" + longURL);
    }
  }
});

app.listen(PORT, () => {
  console.log("Tiny app listening on port ${PORT}!");
});