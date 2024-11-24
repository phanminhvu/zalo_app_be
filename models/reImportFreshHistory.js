const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reImportFreshHistorySchema = new Schema({
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
  shiftDay: {
    type: String
  },
  shiftCode: {
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
  reImportFreshPhoto: {
    type: Array
  },
  reImportFreshReason: {
    type: String,
  },
  oldReImportFreshId: {
    type: String,
    rqeuired: true,
    index: true,
    unique: true
  },
  freshBalance: {
    type: Number
  }
});

const ReImportFreshHistory = mongoose.model("ReImportFreshHistory", reImportFreshHistorySchema);
ReImportFreshHistory.createIndexes();

module.exports = ReImportFreshHistory;