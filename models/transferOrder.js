const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transferOrderSchema = new Schema({
  orderDetail: {
    type: mongoose.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  sender: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  fromStore: {
    type: mongoose.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  toStore: {
    type: mongoose.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  timeStamp: {
    type: String,
    required: true
  },
  shiftDay: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model("TransferOrder", transferOrderSchema);