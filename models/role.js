const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roleSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  permission: {
    type: Array,
    required: true
  },
  permissionVN: {
    type: Array,
    required: true
  },
});

module.exports = mongoose.model("Role", roleSchema);