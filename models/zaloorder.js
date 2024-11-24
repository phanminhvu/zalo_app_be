const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
order: Object,
customer_id: String,
orderId: String,
createdAt: {
    type: Date,
    default: Date.now
  }
})
module.exports = mongoose.model("ZaloOrder", userSchema);