const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const subStockSchema = new Schema({
  maxCapacity: {
    type: Number,
    required: true
  },
  lossRatio: {
    type: Number,
    required: true
  },
  averageConsumption: {
    type: Number,
    required: true
  },
  store: {
    type: mongoose.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  freshInventory: {
    type: Number,
    required: true
  },
  cookedInventory: {
    type: Number,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  }
});

const SubStock = mongoose.model("SubStock", subStockSchema);

module.exports = SubStock;