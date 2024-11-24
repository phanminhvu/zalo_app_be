const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPassword: {
    type: String
  },
  photo: {
    type: String,
    required: true,
  },
  role: {
    type: mongoose.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  store: {
    type: mongoose.Types.ObjectId,
    ref: 'Store'
  },
  notes: [{
    content: { type: String },
    color: { type: String }
  }
  ],
  accessToken: {
    type: String
  },
  tokenDevice: {
    type: String
  }
});

module.exports = mongoose.model("User", userSchema);
