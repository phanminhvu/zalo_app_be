const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  quantity: {
    type: Number,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  quickPurchase: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    index: true,
    required: true,
  },
  payment: {
    type: String,
    required: true,
  },
  app: {
    type: Boolean,
    required: true
  },
  tag: [{
    name: { type: String },
    color: { type: String }
  }],
  store: {
    type: mongoose.Types.ObjectId,
    ref: 'Store',
    index: true,
    required: true
  },
  uniqueCode: {
    type: String,
    index: true,
    unique: true,
    required: true
  },
  shiftCode: {
    type: String
  },
  shiftIndex: {
    type: Number
  },
  shiftDay: {
    type: String
  },
  date: {
    type: String,
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  shiftWeek: {
    type: String
  },
  photoAttach: [{
    type: String
  }],
  phone: [{
    type: String
  }],
  creator: {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
  },
  producer: {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    produceStart: {
      type: String,
    },
    produceEnd: {
      type: String,
    }
  },
  shippingService: {
    serviceName: {
      type: String
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    timeStamp: {
      type: Number,
    },
  },
  shippingFee: {
    type: Number
  },
  shipper: {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    shipStart: {
      type: String,
    },
    shipEnd: {
      type: String,
    },
    timeStamp: {
      type: Number,
    },
  },
  confirmShip: {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    }
  },
  transferStore: {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    fromStore: {
      type: mongoose.Types.ObjectId,
      ref: 'Store',
    },
    timeStamp: {
      type: String
    }
  },
  toStore: {
    type: mongoose.Types.ObjectId,
    ref: 'Store',
  },
  toStoreOrder: {
    type: mongoose.Types.ObjectId,
    ref: 'Order',
  },
  edited: {
    value: Boolean,
  },
  deletor: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  deleteReason: {
    type: String
  },
  deletePhoto: {
    type: String
  }
});

const Order = mongoose.model("Order", orderSchema);
Order.createIndexes()

module.exports = Order;