const { default: mongoose, Types } = require("mongoose");

const Schema = mongoose.Schema;

const customerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: Number,
    required: true
  },
});

module.exports = mongoose.model('Customer', customerSchema)