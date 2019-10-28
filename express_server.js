const express = require("express");
const app = express();
const PORT = 8080;
const reload = require("reload");

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"  
};

app.get("/urls", (req, res) => {
  let templateVars = {url: urlDatabase};
  res.render('urls_index', templateVars);
});
app.get("/", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL: req};
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log("Example app listening on port ${PORT}!");
});