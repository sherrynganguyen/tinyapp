// |x| After we generate our new shortURL, we add it to our database.
// |x| Our server then responds with a redirect to /urls/:shortURL.
// | | Our browser then makes a GET request to /urls/:shortURL.
// | | Our server looks up the longURL from the database, sends the shortURL and longURL to the urls_show template, generates the HTML, and then sends this HTML back to the browser.
// | | The browser then renders this HTML.



const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "https://www.lighthouselabs.ca",
  "9sm5xK": "https://www.google.com"  
};

function generateRandomString() {
  const randomData = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += randomData.charAt(Math.floor(Math.random()*(randomData.length)));
  }
  return randomString;
};
app.get("/", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {urlDatabase: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let t = `${generateRandomString()}`;
  urlDatabase[t] = req.body.longURL;
  res.redirect(`/urls/${t}`);
})
app.get("/urls/:shortURL", (req, res) => {
  // let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  if (urlDatabase[req.params.shortURL.charAt('http') > 0]) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.redirect("http://" + urlDatabase[req.params.shortURL]);    
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log("Example app listening on port ${PORT}!");
});