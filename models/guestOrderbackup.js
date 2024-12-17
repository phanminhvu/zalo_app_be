const { default: mongoose, Types } = require("mongoose");

const Schema = mongoose.Schema;

const guestOrderSchema = new Schema({
  createdAt: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  productInfo: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  payment: {
    type: String,
    required: true
  },
  bill: {
    type: Number,
    required: true
  },
  note: {
    type: String
  },
  store: {
    type: Types.ObjectId,
    ref: 'Store'
  },
  status: {
    type: String
  },
  currency: {
    type: String
  },
  total_item: {
    type: Number
  }
});

// module.exports = mongoose.model('GuestOrder', guestOrderSchema)
