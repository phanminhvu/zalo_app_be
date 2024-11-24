const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const timerOrderSchema = new Schema({
  createOrderData: {
    type: Object,
    required: true
  },
  phone: [{
    type: String
  }],
  timer: {
    type: Object,
    required: true
  },
  shiftDay: {
    date: {
      type: String
    },
    month: {
      type: String
    },
    year: {
      type: String
    }
  },
  shiftCode: {
    type: String
  },
  jobName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("TimerOrder", timerOrderSchema);