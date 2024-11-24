const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const soldHistorySchema = new Schema({
  action: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  store: {
    type: mongoose.Types.ObjectId,
    ref: 'Store'
  },
  orderId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  shiftDay: {
    type: String
  },
  shiftCode: {
    type: String
  },
  shiftIndex: {
    type: String
  },
  timeStamp: {
    type: String,
  },
  timeStampHistory: {
    type: Number,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  cookedBalance: {
    type: Number
  },
});

const SoldHistory = mongoose.model("SoldHistory", soldHistorySchema);

SoldHistory.createIndexes();

module.exports = SoldHistory;