const { default: mongoose, Types } = require("mongoose");

const Schema = mongoose.Schema;

const storeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
  },
  todayStoreOrders: {
    type: Number,
    default: 0
  },
  todayStoreQuantity: {
    type: Number,
    default: 0
  },
  guestOrders: {
    type: Number,
    default: 0
  },
  dateRecord: {
    type: String
  },
  display_transfer_info: {
    type: Boolean,
    required: true,
    default: false
  },
  bank: {
    type: String
  },
  account_name: {
    type: String
  },
  account_number: {
    type: String
  },
  phone: {
    type: String
  }
});

module.exports = mongoose.model("Store", storeSchema);