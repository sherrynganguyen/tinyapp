const express = require("express");
const route = express.Router();
const getDomainUrl = require('get-domain-url');
const time = require('express-timestamp');
route.use(time.init);
const {generateRandomString, checkUserByEmail, findUserByEmail, findLongURL, findUserURL} = require('../helpers');

const bcrypt = require('bcrypt');

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$f9ETSYlgdTFV53vpYMWjG.epNDqxBEIJWvKPfTZVowKtTp0wJYYX6"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$yrRsbjMU6.9z1WhUaqGh0OUtx51oC9NdZj7fIXaGIOAJ/DuLIoozi"
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID", date: "2019-10-08", view: 0, uniqueV: 0},
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID", date: "2018-11-19", view: 0, uniqueV: 0}
};

const uniqueVisit = {
  b6UTxQ: ["12se3d"],
  i3BoGr: []
}

//---------------------------------------------------------------------------------------//

//Website defaut, login/register pages

route.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

route.get("/", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

route.get("/register", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls");
  } else {
    res.render("urls_register",{ userID: req.session.user_ID });
  }
});

route.get("/login", (req, res) => {
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

route.post("/register", (req, res) => {
  let templateVars = {
    userID: req.session.user_ID,
    email: req.session.email
  };
  if (req.body.email === "" || req.body.password === "") {
    templateVars["message"] = "Incorrect password/username format.";
    res.render("urls_error", templateVars);
  } else if (checkUserByEmail(req.body.email, users)) {
    templateVars["message"] = "Email existed. Process to login.";
    res.render("urls_error", templateVars);
  } else {
    const userID = generateRandomString();
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

route.post("/login", (req, res) => {
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

route.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// Specific User features - List of URLs

route.get("/urls", (req, res) => {
  let templateVars = {
    userID: req.session.user_ID,
    email: req.session.email,
    urlDatabase: findUserURL(req.session.user_ID, urlDatabase)
  };
  if (req.session.user_ID) {
    res.render("urls_index", templateVars);
  } else {
    templateVars["message"] = "Please login or register!";
    res.render("urls_error", templateVars);
  }
});

// Add/Delete/Edit URL - Handling error when non-users or another users access to the links

// Create new URL

route.get("/urls/new", (req, res) => {
  if (req.session.user_ID) {
    res.render("urls_new", {userID: req.session.user_ID, email: req.session.email});
  } else {
    res.redirect("/");
  }
});

route.post("/urls", (req, res) => {
  let templateVars = {
    userID: req.session.user_ID,
    email: req.session.email
  };
  if (req.session.user_ID) {
    let newURL = `${generateRandomString()}`;
    if (getDomainUrl(req.body.longURL)) {
      //stretch: time created
      const hour = req.timestamp.tz("America/Los_Angeles").format();
      const date = hour.substring(0,10);
      //
      urlDatabase[newURL] = {longURL: req.body.longURL, userID: req.session.user_ID, date: date , view: 0, uniqueV: 0};
      res.redirect(`/urls/${newURL}`);
    } else {
      templateVars["message"] = "Your URL is not in correct format.";
      res.render("urls_error", templateVars);
    }
  } else {
    templateVars["message"] = "You do not have access to create shortURL.";
    res.render("urls_error", templateVars);
  }
});

// Edit URL

route.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    userID: req.session.user_ID,
    email: req.session.email,
  };
  if (!(`${req.params.shortURL}` in urlDatabase)) {
    templateVars["message"] = "Incorrect URL.";
    res.render("urls_error", templateVars);
  } else {
    if (req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
      templateVars["shortURL"] = req.params.shortURL;
      templateVars["longURL"] = urlDatabase[req.params.shortURL].longURL;
      templateVars["date"] = urlDatabase[req.params.shortURL].date;
      templateVars["visit"] = urlDatabase[req.params.shortURL].view;
      templateVars["unique"] = urlDatabase[req.params.shortURL].uniqueV;
      res.render("urls_show", templateVars);
    } else {
      templateVars["message"] = "You do not have access to this link.";
      res.render("urls_error", templateVars);
    }
  }
});

route.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_ID) {
    res.redirect(`/urls/${req.params.shortURL}`);
  } else {
    res.send("No access. Please login to edit the link.");
  }
});

// Block other to edit the link

route.post("/u/:shortURL", (req, res) => {
  if (req.session.user_ID && req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    if (getDomainUrl(req.body.longURL)) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      res.redirect("/urls");
    } else {
      let templateVars = {
        userID: req.session.user_ID,
        email: req.session.email,
        message: "Your URL is not in correct format."
      };
      res.render("urls_error", templateVars);
    }
  } else {
    res.redirect("/");
  }
});

//Delete URL

route.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_ID && req.session.user_ID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send("Sorry! You do not have access to delete this link.");
  }
});

// Redirect to longURL

route.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!findLongURL(shortURL, urlDatabase)) {
    let templateVars = {
      userID: req.session.user_ID,
      email: req.session.email,
      message: "Your shortenURL is incorrect."
    };
    res.render("urls_error", templateVars);
  } else {
    if (req.session.user_ID) {
      urlDatabase[req.params.shortURL].view += 1;
      urlDatabase[req.params.shortURL].uniqueV += 1; 

    } else {
      urlDatabase[req.params.shortURL].view += 1;
    }  
    let longURL = findLongURL(shortURL, urlDatabase);
    if (longURL.indexOf('http') === 0) {
      res.redirect(longURL);
    } else {
      res.redirect("http://" + longURL);
    }
  }
});

module.exports = route;