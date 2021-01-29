const router = require("express").Router();
const { insert, getByUsername } = require("./auth-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/secrets");

router.post("/register", (req, res, next) => {
  const user = req.body;
  if (!user.username || !user.password) {
    res.status(400).json({ message: "username and password required" });
  } else {
    const hash = bcrypt.hashSync(user.password, 8);

    user.password = hash;

    getByUsername(user.username)
      .then((allegedUser) => {
        if (allegedUser?.username) {
          res.status(400).json({ message: "username taken" });
        } else {
          insert(user)
            .then((user) => {
              res.status(201).json(user);
            })
            .catch(next);
        }
      })
      .catch(next);
  }

  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
});

router.post("/login", (req, res, next) => {
  const user = req.body;
  if (!user.username || !user.password) {
    res.status(400).json({ message: "username and password required" });
  } else {
    getByUsername(user.username)
      .then((allegedUser) => {
        if (
          !allegedUser?.username ||
          !bcrypt.compareSync(user.password, allegedUser.password)
        ) {
          res.status(400).json({ message: "invalid credentials" });
        } else {
          const token = generateToken(user);
          res.status(200).json({
            message: `Welcome, ${user.username}`,
            token,
          });
        }
      })
      .catch(next);
  }
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
});

router.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
  };

  const options = {
    expiresIn: "2m",
  };

  return jwt.sign(payload, jwtSecret, options);
}

module.exports = router;
