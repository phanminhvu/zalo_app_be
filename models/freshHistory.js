const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const freshHistorySchema = new Schema({
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
  importFreshPhoto: {
    type: Array
  },
  freshExportPhoto: {
    type: Array
  },
  reImportFresh: {
    type: Boolean,
  },
  reImportFreshPhoto: {
    type: Array
  },
  reImportFreshReason: {
    type: String,
  },
  oldReImportFreshId: {
    type: String,
  },
  cooked: {
    type: Boolean,
  },
  remainingCookedQuantity: {
    type: Number
  },
  freshBalance: {
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

module.exports = mongoose.model("FreshHistory", freshHistorySchema);