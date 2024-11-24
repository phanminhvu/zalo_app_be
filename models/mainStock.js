const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const mainStockSchema = new Schema({
  maxCapacity: {
    type: Number,
    required: true
  },
  manufacturePlan: {
    type: Number,
    required: true
  },
  inventory: {
    type: Number
  }
});

module.exports = mongoose.model("MainStock", mainStockSchema);