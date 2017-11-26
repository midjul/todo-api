const mongoose = require("mongoose");

const mongoURL = process.env.MONGO_URI;
mongoose.Promise = global.Promise;

mongoose.connect(mongoURL, {
  useMongoClient: true
});

module.exports = {
  mongoose
};
