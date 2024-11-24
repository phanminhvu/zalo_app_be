const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const updatedOrderSchema = new Schema({
  originalId: {
    type: String
  },
  store: {
    type: String
  },
  editor: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  timeStamp: {
    type: String
  },
  orderData: {
    type: Object
  },
});

module.exports = mongoose.model("UpdatedOrder", updatedOrderSchema);