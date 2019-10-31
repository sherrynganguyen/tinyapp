const { assert } = require('chai');

const { checkUserByEmail, findUserByEmail, findUserURL } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" },
  i3xoGr: { longURL: "https://www.google.com", userID: "userRandomID" }
};


//-----------------------TEST FOR checkUserByEmail-----------------------//

describe('checkUserByEmail', function() {
  it('should return userID if email exists in the database', function() {
    const user = checkUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });
  it('should return undefined if email does not exist in the database', function() {
    const user = checkUserByEmail("123@example.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
  it('should return true if email does not exist in the database', function() {
    const user = checkUserByEmail("123@example", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});

//-----------------------TEST FOR findUserByEmail-----------------------//

describe('findUserByEmail', function() {
  it('should return userID if email exists in the database', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });
});

describe('findUserByEmail', function() {
  it('should return empty string if email does not exist in the database', function() {
    const user = findUserByEmail("123@example.com", testUsers);
    const expectedOutput = "";
    assert.equal(user, expectedOutput);
  });
});

//-----------------------TEST FOR findUserURL-----------------------//

describe('findUserURL', function() {
  it('should return object for special user', function() {
    const user = findUserURL("userRandomID", testUrlDatabase);
    const expectedOutput = {b6UTxQ: "https://www.tsn.ca", i3xoGr: "https://www.google.com"};
    assert.deepEqual(user, expectedOutput);
  });
  it('should return object for special user', function() {
    const user = findUserURL("user2RandomID", testUrlDatabase);
    const expectedOutput = {i3BoGr: "https://www.google.ca"};
    assert.deepEqual(user, expectedOutput);
  });
});