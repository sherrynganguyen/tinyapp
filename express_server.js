const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// const cookieSession = require('cookie-session');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");
// app.use(cookieSession({
//   name: 'session',
//   keys: ['user_ID'],
// }))

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "456"
  }
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//-------------------------------------------------------------------------//

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


//-------------------------------------------------------------------------//

app.get("/", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    userID: req.cookies.user_ID,
    email: req.cookies.email,
    // userID: req.session.user_ID,
    urlDatabase: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let newURL = `${generateRandomString()}`;
  urlDatabase[newURL] = req.body.longURL;
  res.redirect(`/urls/${newURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!(`${req.params.shortURL}` in urlDatabase)) {
    res.send("Incorrect URL");
  } else {
    let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  if (templateVars.longURL.indexOf('http') === 0) {
    res.redirect(templateVars.longURL);
  } else {
    res.redirect("http://" + templateVars.longURL);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  res.render("urls_show");
});

app.post("/u/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

//--------------------------------------------------------// login

app.get("/login", (req, res) => {
  res.render("urls_login", {userID: null});
});

app.post("/login", (req, res) => {
  if (verifyExistedEmail(req.body.email) === "") {
    res.send('Error');
  } else {
    res.cookie('user_ID', users[verifyExistedEmail(req.body.email)].id);
    res.cookie('email', users[verifyExistedEmail(req.body.email)].email);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_ID', req.body.userID);
  res.redirect("/urls");
});

//---------------------------------------------------------// register endpoint

app.get("/register", (req, res) => {
  res.render("urls_register",{ userID: req.cookies.user_ID });
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status("404").send("Error");
  } else if (!checkEmail(req.body.email)) {
    res.status("400").send("Email already exits");
  } else {
    const userID = generateRandomString();
    res.cookie('user_ID', userID);
    res.cookie('email', email);
    users[userID] = {
      id: userID,
      ...req.body
    };
    // console.log(users);
    
    // req.session.user_ID = userID;
    res.redirect("/urls");
  }  
});

app.listen(PORT, () => {
  console.log("Example app listening on port ${PORT}!");
});