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
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
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

function findUserURL(userID) {
  let userURLList = [];
  for (let shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      userURLList[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userURLList;
}


//-------------------------------------------------------------------------//

app.get("/", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  userID = req.cookies.user_ID;
  email = req.cookies.email;
  if (req.cookies.user_ID) {
    let templateVars = {
      urlDatabase: findUserURL(req.cookies.user_ID)
    };
    
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_ID) {
    res.render("urls_new", {userID: req.cookies.user_ID, email: req.cookies.email});
  } else {
    res.redirect('/urls');
  }

});

app.post("/urls", (req, res) => {
  let newURL = `${generateRandomString()}`;
  urlDatabase[newURL] = {longURL: req.body.longURL, userID: req.cookies.user_ID};
  res.redirect(`/urls/${newURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  userID= req.cookies.user_ID;
  email= req.cookies.email;
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  if (req.cookies.user_ID === urlDatabase[req.params.shortURL].userID) {
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

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
  if (templateVars.longURL.indexOf('http') === 0) {
    res.redirect(templateVars.longURL);
  } else {
    res.redirect("http://" + templateVars.longURL);
  }
});

// app.get("/urls/:shortURL/delete", (req, res) => {
//   // if (req.cookies.user_ID && req.cookies.user_ID !== urlDatabase[req.params.shortURL].userID) {
//     res.redirect("/urls");
//   // } else {
//     // res.redirect("/urls");
//   // }
// });

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.user_ID && req.cookies.user_ID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

// app.get("/u/:shortURL", (req, res) => {
//     res.render("urls_show");
// });

app.post("/u/:shortURL", (req, res) => {
  if (req.cookies.user_ID && req.cookies.user_ID === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
  } else {
    res.redirect(`/u/:shortURL`);
  }  
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
    res.cookie('email', req.body.email);
    users[userID] = {
      id: userID,
      ...req.body
    };
    
    // req.session.user_ID = userID;
    res.redirect("/urls");
  }  
});

app.listen(PORT, () => {
  console.log("Example app listening on port ${PORT}!");
});