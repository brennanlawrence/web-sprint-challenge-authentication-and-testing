const db = require("../../data/dbConfig");

module.exports = {
  insert,
  getByUsername,
};

function insert(user) {
  return db("users")
    .insert(user)
    .then((id) => {
      return db("users").where("id", id[0]);
    });
}

function getByUsername(username) {
  return db("users")
    .where("username", username)
    .then((res) => {
      return res[0];
    });
}
