const mongoose = require("mongoose");
const mongoURL = process.env.MONGOURL || "mongodb://localhost:27017/TodoApp";
mongoose.Promise = global.Promise;

mongoose.connect(mongoURL, {
  useMongoClient: true
});

module.exports = {
  mongoose
};
