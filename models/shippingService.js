const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shippingServiceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  store: {
    type: mongoose.Types.ObjectId,
    required: true
  }
});

module.exports = mongoose.model("ShippingService", shippingServiceSchema);