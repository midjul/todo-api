const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/TodoApp");

let Todo = mongoose.model("Todo", {
  text: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  }
});

let User = mongoose.model("User", {
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  }
});
let user = new User({
  email: "first@dot.com"
});
user.save().then(
  doc => {
    console.log("User saved", doc);
  },
  e => console.log("User saving error", e)
);
/*
let newTodo = new Todo({
  text: "Cook dinner",
  completed: false,
  completedAt: 12454
});
let newTodo = new Todo({
    text: "Learn Node",
    completed: false,
    completedAt: 24523
});

newTodo.save().then(
    doc => {
        console.log("Saved todo", doc);
    },
    e => console.log("Unable to save todo", e)
);
*/
