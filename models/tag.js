const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  store: {
    type: mongoose.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  color: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model("Tag", tagSchema);