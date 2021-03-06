const validator = require("validator");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      isAsync: true,
      validator: function(value, cb) {
        cb(validator.isEmail(value), value);
      },
      message: "{VALUE} is not valid email"
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

UserSchema.methods.generateAuthToken = function() {
  let user = this;
  let access = "auth";
  var token = jwt
    .sign({ _id: user._id, access }, process.env.JWT_SECRET)
    .toString();
  user.tokens.push({
    access,
    token
  });
  return user.save().then(() => {
    return token;
  });
};
UserSchema.methods.toJSON = function() {
  let user = this;
  let userObject = user.toObject();
  return _.pick(userObject, ["_id", "email"]);
};

UserSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return Promise.reject(error);
  }
  return User.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "tokens.access": "auth"
  });
};

UserSchema.statics.findByCredentials = function(email, password) {
  let User = this;
  return User.findOne({ email }).then(doc => {
    if (!doc) return Promise.reject("User not found");

    return bcrypt.compare(password, doc.password).then(res => {
      if (!res) return Promise.reject("Invalid Password");

      return doc;
    });
  });
};

UserSchema.methods.removeToken = function(token) {
  let user = this;

  return user.update({
    $pull: {
      tokens: { token }
    }
  });
};

UserSchema.pre("save", function(next) {
  var user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) throw new Error("User could now be saved");
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});
let User = mongoose.model("User", UserSchema);

module.exports = { User };
