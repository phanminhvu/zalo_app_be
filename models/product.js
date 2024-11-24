const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  action: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
  },
  unitPrice: {
    type: Number,
  },
  deliveryReceiptPicture: {
    type: Array
  },
  timeStamp: {
    type: String,
  },
  timeStampHistory: {
    type: Number,
  },
  billTimeStamp: {
    type: String,
  },
  billTimeStampHistory: {
    type: Number,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  note: {
    type: String,
  },
  payment: {
    type: String,
  },
  billCode: {
    type: String,
  },
  paymentPicture: {
    type: Array
  },
  request: {
    quantity: {
      type: Number
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: 'Store'
    },
    status: {
      type: String,
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
    userConfirm: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    confirmPicture: {
      type: String
    },
    confirmMultiPicture: {
      type: Array
    }
  },
  balance: {
    type: Number,
  },
  balanceStore: {
    type: Number
  }

});

module.exports = mongoose.model("Product", productSchema);