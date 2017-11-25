const { User } = require("./../models/user");

const authenticate = (req, res, next) => {
  let token = req.header("x-auth");
  User.findByToken(token)
    .then(user => {
      if (!user) {
        return Promise.reject("User not found");
      }
      req.user = user;
      req.token = token;
      next();
    })
    .catch(e => {
      res.status(401).json({});
    });
};

module.exports = { authenticate };
