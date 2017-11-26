require("./config/config");

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const { mongoose } = require("./db/mongoose");
const { Todo } = require("./models/todo");
const { User } = require("./models/user");
const { ObjectID } = require("mongodb");
const { authenticate } = require("./middleware/authenticate");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/todos", authenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });
  todo.save().then(
    doc => {
      res.json(doc);
    },
    e => {
      res.status(400).send(e);
    }
  );
});

app.get("/todos", authenticate, (req, res) => {
  Todo.find({ _creator: req.user._id })
    .then(todos => res.json({ todos }))
    .catch(e => res.status(400).send(e));
});

app.get("/todos/:id", authenticate, (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) return res.status(404).json({});

  Todo.findOne({ _id: id, _creator: req.user._id })
    .then(todo => {
      if (!todo) return res.status(404).json({});

      res.json({ todo });
    })
    .catch(err => res.status(400).json({}));
});

app.delete("/todos/:id", authenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) return res.status(404).json({});

  Todo.findOneAndRemove({ _id: id, _creator: req.user._id })
    .then(todo => {
      if (!todo) throw new Error("todo not found"); //res.status(404).json({});

      res.json({ todo });
    })
    .catch(err => res.status(400).json({}));
});

app.patch("/todos/:id", authenticate, (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ["text", "completed"]);
  if (!ObjectID.isValid(id)) return res.status(404).json({});
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }
  Todo.findOneAndUpdate(
    { _id: id, _creator: req.user._id },
    { $set: body },
    { new: true }
  )
    .then(todo => {
      if (!todo) return res.status(400).send();
      res.json({ todo });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.post("/users", (req, res) => {
  const userData = _.pick(req.body, ["email", "password"]);
  const user = new User(userData);
  user
    .save()
    .then(doc => {
      return user.generateAuthToken();
    })
    .then(token => {
      res.header("x-auth", token).send(user);
    })
    .catch(err => res.status(400).send(err));
});

app.get("/users/me", authenticate, (req, res) => {
  res.send(req.user);
});

app.post("/users/login", (req, res) => {
  const user = _.pick(req.body, ["email", "password"]);
  User.findByCredentials(user.email, user.password)
    .then(user => {
      return user.generateAuthToken().then(token => {
        res.header("x-auth", token).json(user);
      });
    })
    .catch(err => res.status(400).json(err));
});

app.delete("/users/me/token", authenticate, (req, res) => {
  req.user.removeToken(req.token).then(
    () => {
      res.status(200).json();
    },
    err => {
      res.status(400).json();
    }
  );
});
app.listen(port, () => console.log(`Running on port: ${port}`));

module.exports = {
  app
};
