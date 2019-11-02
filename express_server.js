const express = require("express");
const app = express();
const route = require('./routes/users');
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name:'session',
  keys: ['sherry'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.set("view engine", "ejs");
app.use('/', route);

app.listen(PORT, () => {
  console.log("Tiny app listening on port ${PORT}!");
});