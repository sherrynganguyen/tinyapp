const generateRandomString = function() {
  const randomData = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += randomData.charAt(Math.floor(Math.random() * (randomData.length)));
  }
  return randomString;
};

const checkUserByEmail = function(email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return database[user].id;
    }
    return undefined;
  }
};

const findUserByEmail = function(email, database) {
  let verifiedID = "";
  for (let user in database) {
    if (email === database[user].email) {
      verifiedID = database[user].id;
      return verifiedID;
    }
    verifiedID = "";
  }
  return verifiedID;
};

const findUserURL = function(userID, database) {
  let userURLList = {};
  for (let shortURL in database) {
    if (userID === database[shortURL].userID) {
      userURLList[shortURL] = {longURL: database[shortURL].longURL, date: database[shortURL].date,view: database[shortURL].view};
    }
  }
  return userURLList;
};

const arr = function(id, array1) {
  let result = false;
  for (let i in array1) {
    if (id === array1[i]) {
      result = true;
    }
  }
  return result;
};

const uniqueV = function(userID, shortURL, obj) {
  let array = obj[shortURL];
  if (!arr(userID, array)) {
    return array.length;
  } else {
    array.push(userID);
    return array.length;
  }
};

const findLongURL = function(shortURL, database) {
  let longURL = "";
  for (let url in database) {
    if (shortURL === url) {
      longURL = database[url].longURL;
      return longURL;
    }
    longURL = undefined;
  }
  return longURL;
};

module.exports = {
  generateRandomString,
  checkUserByEmail,
  findUserByEmail,
  findLongURL,
  findUserURL,
  arr,
  uniqueV
};