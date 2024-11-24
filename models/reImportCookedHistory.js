const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reImportCookedHistorySchema = new Schema({
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
    index: true,
    unique: true,
    required: true
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
  deleteReason: {
    type: String
  },
  deleteMultiPhoto: {
    type: Array
  },
  cookedBalance: {
    type: Number
  },
});

const ReImportCookedHistory = mongoose.model("ReImportCookedHistory", reImportCookedHistorySchema);

ReImportCookedHistory.createIndexes();

module.exports = ReImportCookedHistory;