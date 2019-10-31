const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const aes256 = require('aes256');
const key = 'sherry';
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name:'session',
  keys: ['user_ID'],
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

function generateRandomString() {
  const randomData = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += randomData.charAt(Math.floor(Math.random() * (randomData.length)));
  }
  return randomString;
}

function checkEmail(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return false;
    }
    return true;
  }
}

function verifyExistedEmail(email) {
  let verifiedID = "";
  for (let user in users) {
    if (email === users[user].email) {
      verifiedID = users[user].id;
    }
  }
  return verifiedID;
}

function findUserURL(userID) {
  let userURLList = [];
  for (let shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      userURLList[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userURLList;
}

//---------------------------------------------------------------------------------------//

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  userID = req.session.user_ID;
  email = req.session.email;
  if (req.session.user_ID) {
    let templateVars = {
      urlDatabase: findUserURL(req.session.user_ID)
    };
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/register", (req, res) => {
  res.render("urls_register",{ userID: req.session.user_ID });
});

app.get("/login", (req, res) => {
  res.render("urls_login", {userID: null});
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_ID) {
    res.render("urls_new", {userID: req.session.user_ID, email: req.session.email});
  } else {
    res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  let newURL = `${generateRandomString()}`;
  urlDatabase[newURL] = {longURL: req.body.longURL, userID: req.session.user_ID};
  res.redirect(`/urls/${newURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  userID = req.session.user_ID;
  email = req.session.email;
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  if (req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    if (!(`${req.params.shortURL}` in urlDatabase)) {
      res.send("Incorrect URL");
    } else {
      res.render("urls_show", templateVars);
    }
  } else {
    if (templateVars.longURL.indexOf('http') === 0) {
      res.redirect(templateVars.longURL);
    } else {
      res.redirect("http://" + templateVars.longURL);
    }
  }
});

// app.get("/u/:shortURL", (req, res) => {
//   res.render("urls_show");
// });

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
  if (templateVars.longURL.indexOf('http') === 0) {
    res.redirect(templateVars.longURL);
  } else {
    res.redirect("http://" + templateVars.longURL);
  }
});

/*User registration endpoints.
  Handling error such as:
    - Register with empty email/password, existed email address
    - Log in with email that is not in database
*/

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status("404").send("Incorrect email or password format.");
  } else if (!checkEmail(req.body.email)) {
    res.status("400").send("Email already exits");
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
  if (verifyExistedEmail(req.body.email) === "") {
    res.send('Email does not exist in our site.');
  } else {
    if (bcrypt.compareSync(req.body.password, users[verifyExistedEmail(req.body.email)].password)) {
      req.session.user_ID = verifyExistedEmail(req.body.email);
      req.session.email = users[verifyExistedEmail(req.body.email)].email;
      res.redirect("/urls");
    } else {
      res.send('Incorrect password');
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

/* Edit/Delete feature for users
   Not allow another users and non-users delete or edit URLs do not belong to them.
   Either redirect them to login pages (delete cases) or redirect to longURL pages (access to shortURL by the link)
*/
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_ID && req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/u/:shortURL", (req, res) => {
  if (req.session.user_ID && req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
  } else {
    res.redirect(`/u/:shortURL`);
  }
});

app.listen(PORT, () => {
  console.log("Tiny app listening on port ${PORT}!");
});