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
    }
  }
  return verifiedID;
};

const findUserURL = function(userID, database) {
  let userURLList = {};
  for (let shortURL in database) {
    if (userID === database[shortURL].userID) {
      userURLList[shortURL] = database[shortURL].longURL;
    }
  }
  return userURLList;
};

module.exports = {
  generateRandomString,
  checkUserByEmail,
  findUserByEmail,
  findUserURL
};