const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cookedHistorySchema = new Schema({
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
    type: String
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
  deletePhoto: {
    type: String
  },
  deleteMultiPhoto: {
    type: Array
  },
  beforeCookedQuantity: {
    type: Number
  },
  reImportCookedReason: {
    type: String,
  },
  cookedBalance: {
    type: Number
  },
  checkStockPicture: {
    type: String,
  },
  checkStockMultiPicture: {
    type: Array,
  },
  checkStockSystem: {
    type: Number
  },
  checkStockRecord: {
    type: Boolean
  },
  confirmCheckStock: {
    timeStamp: {
      type: String,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    }
  }
});

module.exports = mongoose.model("CookedHistory", cookedHistorySchema);