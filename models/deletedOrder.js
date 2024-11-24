const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const deletedOrderSchema = new Schema({
  store: {
    type: String
  },
  deletor: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  timeStamp: {
    type: String
  },
  orderData: {
    type: Object
  },
  status: {
    type: String
  }
});

module.exports = mongoose.model("DeletedOrder", deletedOrderSchema);