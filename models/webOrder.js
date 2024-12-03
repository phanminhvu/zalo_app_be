const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
order: Object,
orderId: String,
createdAt: {
    type: Date,
    default: Date.now
  }
})
module.exports = mongoose.model("WebOrder", userSchema);