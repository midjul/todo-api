const express = require("express");
const bodyParser = require("body-parser");

const { mongoose } = require("./db/mongoose");
const { Todo } = require("./models/todo");
const { User } = require("./models/user");
const { ObjectID } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/todos", (req, res) => {
  const todo = new Todo({
    text: req.body.text
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

app.get("/todos", (req, res) => {
  Todo.find({})
    .then(todos => res.json({ todos }))
    .catch(e => res.status(400).send(e));
});

app.get("/todos/:id", (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) return res.status(404).json({});

  Todo.findById(id)
    .then(todo => {
      if (!todo) return res.status(404).json({});

      res.json({ todo });
    })
    .catch(err => res.status(400).json({}));
});

app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) return res.status(404).json({});

  Todo.findByIdAndRemove(id)
    .then(todo => {
      if (!todo) throw new Error("todo not found"); //res.status(404).json({});

      res.json({ todo });
    })
    .catch(err => res.status(400).json({}));
});
app.listen(port, () => console.log(`Running on port: ${port}`));

module.exports = {
  app
};
