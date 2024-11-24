const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
