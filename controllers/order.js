const Order = require("../models/order");
const User = require("../models/user");
const CookedHistory = require("../models/cookedHistory");
const SoldHistory = require("../models/soldHistory");
const SubStock = require('../models/subStock');
const io = require("../socket");
const { Types } = require("mongoose");
const { getWeek, getTimeFromString, transformLocalDateString, transformLocalTimeString, transformLocalDateTimeString, getStatisticsTime, checkShiftTime, checkShiftTimeTimerOrder } = require("../utils/getTime");
const Store = require("../models/store");
const UpdatedOrder = require("../models/updatedOrder");
const DeletedOrder = require("../models/deletedOrder");
const nodemailer = require('nodemailer');
const ShippingService = require("../models/shippingService");
const TransferOrder = require("../models/transferOrder");
const { domain } = require("../utils/constant");
const TimerOrder = require('../models/timerOrder');
const schedule = require('node-schedule');
const constant = require('./../utils/constant')
const notification = require('./../services/notification')

const transporter = nodemailer.createTransport({
  pool: true,
  service: 'gmail',
  auth: {
    user: 'quequansystem@gmail.com',
    pass: process.env.NODEMAILER_PASSWORD
  }
});

const backupEmailData = async function (store, subject, data) {
  try {
    const storeManager = await User.findOne({ store: new Types.ObjectId(store), role: new Types.ObjectId('643cef74162c633b558c08d0') });
    if (storeManager) {
      transporter.sendMail({
        to: storeManager.email,
        from: "admin@admin.com",
        subject,
        html: data,
      }, (err, result) => {
        console.log(err);
      });
    }
  } catch (err) {
    console.log(err);
  }
}

const limitOrder = 1000;

exports.getOrders = async (req, res, next) => {
  const date = new Date(Date.now());
  const today = transformLocalDateString(date);
  try {
    const allOrdersExceptSuccess = await Order.find({
      status: ["create", "pending-produce", "produce", "pending-delete-produce", "pending-delete-ship", "ship", "pending-produce-quick", "pending-delete-success"],
      store: req.user.store
    }).sort({ _id: -1 }).limit(limitOrder).lean()
      .populate({
        path: "creator",
        populate: "user",
      })
      .populate({
        path: "producer",
        populate: "user",
      })
      .populate({
        path: "shipper",
        populate: "user",
      }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: "success", store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean().populate({
        path: "shipper",
        populate: "user",
      });
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: "success", store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean().populate({
        path: "shipper",
        populate: "user",
      });
    } else {
      todaySuccessOrders = await Order.find({ status: "success", store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean().populate({
        path: "shipper",
        populate: "user",
      });
    };

    const allOrders = allOrdersExceptSuccess.concat(todaySuccessOrders);
    return res.json(allOrders);
  } catch (err) {
    console.log(err);
  }
};

exports.getOrdersAdmin = async (req, res, next) => {
  const date = new Date(Date.now());
  const { storeId } = req.params;
  const today = transformLocalDateString(date);
  try {
    const allOrdersExceptSuccess = await Order.find({
      status: ["create", "pending-produce", "produce", "pending-delete-produce", "pending-delete-ship", "ship", "pending-produce-quick", "pending-delete-success"],
      store: storeId
    }).sort({ _id: -1 }).limit(limitOrder).lean()
      .populate({
        path: "creator",
        populate: "user",
      })
      .populate({
        path: "producer",
        populate: "user",
      })
      .populate({
        path: "shipper",
        populate: "user",
      }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: "success", store: storeId, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean().populate({
        path: "shipper",
        populate: "user",
      });
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: "success", store: storeId, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean().populate({
        path: "shipper",
        populate: "user",
      });
    } else {
      todaySuccessOrders = await Order.find({ status: "success", store: storeId, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean().populate({
        path: "shipper",
        populate: "user",
      });
    };

    const allOrders = allOrdersExceptSuccess.concat(todaySuccessOrders);
    return res.json(allOrders);
  } catch (err) {
    console.log(err);
  }
};

exports.getOrdersWeightAndQuantity = async (req, res, next) => {
  try {
    const date = new Date();
    const today = transformLocalDateString(date);
    const createOrders = await Order.find({ status: ["create", "pending-produce"], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean();
    const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0);

    const completeProduceOrders = await Order.find({ status: ["produce", "pending-delete-produce"], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean();
    const produceOrdersWeight = completeProduceOrders.reduce((total, order) => total += order.quantity, 0);

    const pendingShipOrders = await Order.find({ status: ["ship", "pending-delete-ship"], store: req.user.store, "shipper.shipEnd": undefined }).sort({ _id: -1 }).limit(limitOrder).lean();
    const shipOrdersWeight = pendingShipOrders.reduce((total, order) => total += order.quantity, 0);

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
    } else {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean()
    };
    const todaySuccessOrdersWeight = todaySuccessOrders.reduce((total, order) => total += order.quantity, 0);

    return res.json({
      totalQuantity:
        createOrders.length +
        completeProduceOrders.length +
        pendingShipOrders.length +
        + todaySuccessOrders.length,
      totalWeight: (createOrdersWeight + produceOrdersWeight + shipOrdersWeight + todaySuccessOrdersWeight).toFixed(1)
    });
  } catch (err) {
    console.log(err);
  }
};


exports.getOrdersQuantity = async (req, res, next) => {
  try {
    const createOrdersQuantity = await Order.find({ status: ["create", "pending-produce"], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    //ĐƠN HÀNG ĐANG XỬ LÝ
    const produceOrdersQuantity = await Order.find({ status: ["produce", "pending-delete-produce"], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    //ĐƠN HÀNG ĐANG GIAO
    const shipOrdersQuantity = await Order.find({ status: ["ship", "pending-delete-ship"], store: req.user.store, "shipper.shipEnd": undefined }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    const date = new Date(Date.now());
    const today = transformLocalDateString(date);

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    } else {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    };

    return res.json({
      createOrdersQuantity,
      produceOrdersQuantity,
      shipOrdersQuantity,
      successOrdersQuantity: todaySuccessOrders,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getOrdersWeight = async (req, res, next) => {
  const date = new Date(Date.now());
  const today = transformLocalDateString(date);
  try {
    const createOrders = await Order.find({ status: ["create", "pending-produce"], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean();
    const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);

    const completeProduceOrders = await Order.find({ status: ["produce", "pending-delete-produce"], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean();
    const produceOrdersWeight = completeProduceOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);

    const pendingShipOrders = await Order.find({ status: ["ship", "pending-delete-ship"], store: req.user.store, "shipper.shipEnd": undefined }).sort({ _id: -1 }).limit(limitOrder).lean();
    const shipOrdersWeight = pendingShipOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
    } else {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean()
    };
    const todaySuccessOrdersWeight = todaySuccessOrders.reduce((total, order) => total += order.quantity, 0);

    return res.json({ createOrdersWeight, produceOrdersWeight, shipOrdersWeight, todaySuccessOrdersWeight: (todaySuccessOrdersWeight).toFixed(1) })
  } catch (err) {
    console.log(err);
  }
}

exports.getTodayOrders = async (req, res, next) => {
  const date = new Date(Date.now());
  const today = transformLocalDateString(date);
  try {
    const createOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: req.user.store }).sort({ _id: -1 }).limit(limitOrder).lean();

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todayOrders;
    if (now <= endMorningToday) {
      todayOrders = createOrders.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
      );
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todayOrders = createOrders.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
      );
    } else {
      todayOrders = createOrders.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
      );
    }
    const todayOrdersQuantity = todayOrders?.reduce(
      (total, order) => (total += order.quantity),
      0
    ).toFixed(1);

    return res.json({ orders: todayOrders.length, todayOrdersQuantity });
  } catch (err) {
    console.log(err);
  }
};

exports.getCreateOrder = async (req, res, next) => {
  try {
    const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: req.user.store }).sort({ _id: 1 }).lean().populate({
      path: "creator",
      populate: "user",
    })
      .populate({
        path: "producer",
        populate: "user",
      })
      .populate({
        path: "shipper",
        populate: "user",
      }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });
    return res.json(createOrders);
  } catch (err) {
    console.log(err);
  }
};

exports.getProduceOrder = async (req, res, next) => {
  try {
    const produceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: req.user.store, shipper: undefined, shippingService: undefined }).sort({ _id: 1 }).lean().populate({
      path: "creator",
      populate: "user",
    })
      .populate({
        path: "producer",
        populate: "user",
      })
      .populate({
        path: "shipper",
        populate: "user",
      });

    return res.json(produceOrders);
  } catch (err) {
    console.log(err);
  }
};

exports.getStartShippingServiceOrders = async (req, res) => {
  try {
    const shippingServiceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: req.user.store, shippingService: { $nin: [undefined] } }).sort({ _id: 1 }).lean()
      .populate({
        path: "producer",
        populate: "user",
      }).populate({ path: "shippingService", populate: "user" });

    const timeStampSet = new Set(shippingServiceOrders.map(order => order.shippingService.timeStamp));
    const timeStampArray = Array.from(timeStampSet);

    const shippingServiceOrdersResponse = []
    timeStampArray.forEach(timeStamp => {
      const order = shippingServiceOrders.filter(order => order.shippingService.timeStamp === timeStamp);
      shippingServiceOrdersResponse.push({ order, timeStamp });
    })
    return res.json(shippingServiceOrdersResponse);

  } catch (err) {
    console.log(err);
  }
}

exports.getEndShippingServiceOrders = async (req, res) => {
  try {
    const shippingServiceOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: req.user.store, shippingService: { $nin: [undefined] } }).sort({ _id: 1 }).lean()
      .populate({
        path: "shipper",
        populate: "user",
      }).populate({ path: "shippingService", populate: "user" });

    const timeStampSet = new Set(shippingServiceOrders.map(order => order.shippingService.timeStamp));
    const timeStampArray = Array.from(timeStampSet);

    const shippingServiceOrdersResponse = []
    timeStampArray.forEach(timeStamp => {
      const order = shippingServiceOrders.filter(order => order.shippingService.timeStamp === timeStamp);
      shippingServiceOrdersResponse.push({ order, timeStamp });
    })
    return res.json(shippingServiceOrdersResponse);

  } catch (err) {
    console.log(err);
  }
}

exports.getShipOrder = async (req, res, next) => {
  try {
    const shipOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: req.user.store, shippingService: undefined, $nor: [{ shipper: undefined }] }).sort({ _id: 1 }).lean().populate({
      path: "creator",
      populate: "user",
    })
      .populate({
        path: "producer",
        populate: "user",
      })
      .populate({
        path: "shipper",
        populate: "user",
      });
    return res.json(shipOrders);
  } catch (err) {
    console.log(err);
  }
};

exports.getSuccessOrder = async (req, res, next) => {
  const date = new Date(Date.now());
  const today = transformLocalDateString(date);
  try {
    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ $or: [{ status: "pending-produce-quick" }, { status: "pending-delete-success" }, { status: "success" }], store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ $or: [{ status: "pending-produce-quick" }, { status: "pending-delete-success" }, { status: "success" }], store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    } else {
      todaySuccessOrders = await Order.find({ $or: [{ status: "pending-produce-quick" }, { status: "pending-delete-success" }, { status: "success" }], store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    }
    return res.json(todaySuccessOrders);
  } catch (err) {
    console.log(err);
  }
};


const extractPhone = (detail) => {
  const detailTransform = detail.trim().split(/[ ,.]+/);
  const regexPhoneNumber = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  const regexOnlyNumber = /^[0-9]*$/;
  let phoneArray = [];
  for (const item of detailTransform) {
    if (regexPhoneNumber.test(item) && regexOnlyNumber.test(item) && item.length === 10) {
      phoneArray.push(item);
    }
  }
  return phoneArray;
}

exports.transferStore = async (req, res) => {
  const date = new Date();
  const today = transformLocalDateString(date);
  const timeStamp = transformLocalDateString(date) +
    " - " +
    transformLocalTimeString(date);

  try {
    const { orderId, toStore } = req.body;
    const fromStore = req.user.store;
    //-----CHECK SHIFT CODE-----
    let shiftCode;
    const checkShift = checkShiftTime();
    if (checkShift.morningShift === true) {
      shiftCode = "S";
    } else {
      shiftCode = "C";
    }

    const ordersByStore = await Order.find({ store: new Types.ObjectId(toStore) }).lean().count();

    //----INDEX SHIFT BY SHIFT CODE-----
    let shiftIndex;
    if (ordersByStore === 0) {
      shiftIndex = 1;
    } else {
      if (shiftCode === 'S') {
        const morningShiftOrderToday = await Order.find({ shiftCode: 'S', shiftDay: checkShift.shiftDay, store: new Types.ObjectId(toStore) }).lean();
        if (morningShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastMorningShiftOrderIndex = morningShiftOrderToday[morningShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastMorningShiftOrderIndex + 1;
        }
      }

      if (shiftCode === 'C') {
        const afternoonShiftOrderToday = await Order.find({ shiftCode: 'C', shiftDay: checkShift.shiftDay, store: new Types.ObjectId(toStore) }).lean();
        if (afternoonShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastAfternoonShiftOrderIndex = afternoonShiftOrderToday[afternoonShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastAfternoonShiftOrderIndex + 1;
        }
      }
    }
    const order = await Order.findById(orderId).populate({
      path: "creator",
      populate: "user",
    }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });

    // ---- SEND NOTIFICATION
    let storeData = await Store.findById(toStore);
    await notification.send(toStore, req.user?.userId, constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} đã chuyển đến kho ${storeData.name}.`, constant.notification.create.status);

    if (order.status !== "transfer") {
      const newOrder = new Order({
        app: order.app,
        detail: order.detail,
        payment: order.payment,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        quickPurchase: order.quickPurchase,
        tag: order.tag === null ? [] : order.tag,
        phone: order.phone,
        photoAttach: order.photoAttach,
        store: new Types.ObjectId(toStore),
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + toStore,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        shiftWeek: checkShift.shiftWeek,
        date: order.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: order.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: order.shiftDay.slice(6, 8),
        creator: order.creator,
        transferStore: { user: new Types.ObjectId(req.user.userId), fromStore, timeStamp },
      })

      await newOrder.save();
      order.status = "transfer";
      order.toStore = new Types.ObjectId(toStore);
      order.toStoreOrder = new Types.ObjectId(newOrder._id);
      await order.save();

      const transferOrderHistory = new TransferOrder({
        orderDetail: new Types.ObjectId(newOrder._id),
        fromStore,
        toStore: new Types.ObjectId(toStore),
        sender: new Types.ObjectId(req.user.userId),
        quantity: order.quantity,
        timeStamp,
        shiftDay: checkShift.shiftDay
      });

      await transferOrderHistory.save();

      const orderRes = await Order.findById(newOrder._id).lean().populate({
        path: "creator",
        populate: "user",
      }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });
      io.getIO().emit(`remove-transfer-order-${fromStore._id}`, order);
      io.getIO().emit(`get-transfer-order-${toStore}`, orderRes);

      //----SOCKET UPDATE CREATE ORDERS QUANTITY
      const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: new Types.ObjectId(toStore) }).lean();
      io.getIO().emit(`create-order-quantity-${toStore}`, createOrders.length);

      //----SOCKET UPDATE CREATE ORDERS WEIGHT
      const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
      io.getIO().emit(`create-order-weight-${toStore}`, createOrdersWeight);

      //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
      const createOrdersToday = await Order.find({ toStore });
      const now = new Date().getTime();
      const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
      const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
      const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
      const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

      let todayOrders;
      if (now <= endMorningToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
        );
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
        );
      } else {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
        );
      }
      const todayOrdersQuantity = todayOrders?.reduce(
        (total, order) => (total += order.quantity),
        0
      ).toFixed(1);
      io.getIO().emit(`get-today-orders-${toStore}`, { orders: todayOrders.length, todayOrdersQuantity });
    }
    return res.end();
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Có lỗi xảy ra trong quá trình chuyển đơn, vui lòng thử lại." });
  }
}

exports.postCreateOrderScheduleUpdate = async (data) => {
  const { quantity, totalPrice, detail, payment, quickPurchase, creator, store, photoAttach, tag, app } = data;
  try {
    // const storeById = await Store.findById(store);
    //----XỬ LÝ GỌI ĐIỆN THOẠI TRÍCH TỪ DETAIL
    const phone = extractPhone(detail);
    const date = new Date();
    const today = transformLocalDateString(date)
    const shiftWeek = getWeek();
    const user = await User.findById(creator.id);
    const createdAt =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);

    //-----CHECK SHIFT CODE-----
    let shiftCode;
    const checkShift = checkShiftTime();
    if (checkShift.morningShift === true) {
      shiftCode = "S";
    } else {
      shiftCode = "C";
    }

    const ordersByStore = await Order.find({ store }).lean().count();

    //----INDEX SHIFT BY SHIFT CODE-----
    let shiftIndex;
    if (ordersByStore === 0) {
      shiftIndex = 1;
    } else {
      if (shiftCode === 'S') {
        const morningShiftOrderToday = await Order.find({ shiftCode: 'S', shiftDay: checkShift.shiftDay, store }).lean();
        if (morningShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastMorningShiftOrderIndex = morningShiftOrderToday[morningShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastMorningShiftOrderIndex + 1;
        }
      }

      if (shiftCode === 'C') {
        const afternoonShiftOrderToday = await Order.find({ shiftCode: 'C', shiftDay: checkShift.shiftDay, store }).lean();
        if (afternoonShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastAfternoonShiftOrderIndex = afternoonShiftOrderToday[afternoonShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastAfternoonShiftOrderIndex + 1;
        }
      }
    }

    if (quickPurchase) {
      const status = "pending-produce-quick";
      const newQuickPurchaseOrder = new Order({
        quantity,
        totalPrice,
        detail,
        status,
        payment,
        quickPurchase,
        app,
        tag: tag === null ? [] : tag,
        phone,
        store: new Types.ObjectId(store),
        photoAttach,
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + store,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        shiftWeek,
        date: checkShift.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: checkShift.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: checkShift.shiftDay.slice(6, 8),
        creator: { user, createdAt },
        producer: { user, produceStart: createdAt, produceEnd: createdAt },
        shipper: { user, shipStart: createdAt, shipEnd: createdAt }
      });
      await newQuickPurchaseOrder.save();
      io.getIO().emit(`get-success-quick-order-${store}`, { newQuickPurchaseOrder, message: 'Tạo đơn hàng nhanh thành công!' });
    }
    else {
      if (user.role?.toString() === "643cf0b3162c633b558c08dc") {
        return;
      }
      const status = "create";
      const newOrder = new Order({
        quantity,
        totalPrice,
        detail,
        status,
        payment,
        quickPurchase,
        app,
        tag: tag === null ? [] : tag,
        phone,
        store: new Types.ObjectId(store),
        photoAttach,
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + store,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        shiftWeek,
        date: checkShift.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: checkShift.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: checkShift.shiftDay.slice(6, 8),
        creator: { user, createdAt },
        edited: {
          value: false,
          count: 0
        }
      });
      await newOrder.save();
      io.getIO().emit(`get-create-order-${store}`, newOrder);
      io.getIO().emit("create-order-alarm");
      io.getIO().emit(`create-order-alarm-${store}`);

      //----SOCKET UPDATE CREATE ORDERS QUANTITY
      const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: new Types.ObjectId(store) }).lean();
      io.getIO().emit(`create-order-quantity-${store}`, createOrders.length);

      //----SOCKET UPDATE CREATE ORDERS WEIGHT
      const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
      io.getIO().emit(`create-order-weight-${store}`, createOrdersWeight);

      //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
      const createOrdersToday = await Order.find({ store });
      const now = new Date().getTime();
      const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
      const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
      const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
      const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

      let todayOrders;
      if (now <= endMorningToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
        );
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
        );
      } else {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
        );
      }
      const todayOrdersQuantity = todayOrders?.reduce(
        (total, order) => (total += order.quantity),
        0
      ).toFixed(1);
      io.getIO().emit(`get-today-orders-${store}`, { orders: todayOrders.length, todayOrdersQuantity });
    }
  } catch (err) {
    console.log(err);
    this.postCreateOrderScheduleUpdate(data);
  }
};

exports.postCreateOrder = async (data) => {
  const { quantity, totalPrice, detail, payment, quickPurchase, creator, store, photoAttach, tag, app } = data;
  try {
    // const storeById = await Store.findById(store);
    //----XỬ LÝ GỌI ĐIỆN THOẠI TRÍCH TỪ DETAIL
    const phone = extractPhone(detail);
    const date = new Date();
    const today = transformLocalDateString(date)
    const shiftWeek = getWeek();
    const user = await User.findById(creator.id);
    const createdAt =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);

    //-----CHECK SHIFT CODE-----
    let shiftCode;
    const checkShift = checkShiftTime();
    if (checkShift.morningShift === true) {
      shiftCode = "S";
    } else {
      shiftCode = "C";
    }

    const ordersByStore = await Order.find({ store }).lean().count();

    //----INDEX SHIFT BY SHIFT CODE-----
    let shiftIndex;
    if (ordersByStore === 0) {
      shiftIndex = 1;
    } else {
      if (shiftCode === 'S') {
        const morningShiftOrderToday = await Order.find({ shiftCode: 'S', shiftDay: checkShift.shiftDay, store }).lean();
        if (morningShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastMorningShiftOrderIndex = morningShiftOrderToday[morningShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastMorningShiftOrderIndex + 1;
        }
      }

      if (shiftCode === 'C') {
        const afternoonShiftOrderToday = await Order.find({ shiftCode: 'C', shiftDay: checkShift.shiftDay, store }).lean();
        if (afternoonShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastAfternoonShiftOrderIndex = afternoonShiftOrderToday[afternoonShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastAfternoonShiftOrderIndex + 1;
        }
      }
    }

    if (quickPurchase) {
      const status = "pending-produce-quick";
      const newQuickPurchaseOrder = new Order({
        quantity,
        totalPrice,
        detail,
        status,
        payment,
        quickPurchase,
        app,
        tag: tag === null ? [] : tag,
        phone,
        store: new Types.ObjectId(store),
        photoAttach,
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + store,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        date: checkShift.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: checkShift.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: checkShift.shiftDay.slice(6, 8),
        shiftWeek,
        creator: { user, createdAt },
        producer: { user, produceStart: createdAt, produceEnd: createdAt },
        shipper: { user, shipStart: createdAt, shipEnd: createdAt }
      });
      await newQuickPurchaseOrder.save();
      io.getIO().emit(`get-success-quick-order-${store}`, { newQuickPurchaseOrder, message: 'Tạo đơn hàng nhanh thành công!' });
    }
    else {
      if (user.role?.toString() === "643cf0b3162c633b558c08dc") {
        return;
      }
      const status = "create";
      const newOrder = new Order({
        quantity,
        totalPrice,
        detail,
        status,
        payment,
        quickPurchase,
        app,
        tag: tag === null ? [] : tag,
        phone,
        store: new Types.ObjectId(store),
        photoAttach,
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + store,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        date: checkShift.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: checkShift.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: checkShift.shiftDay.slice(6, 8),
        shiftWeek,
        creator: { user, createdAt },
        edited: {
          value: false,
          count: 0
        }
      });
      await newOrder.save();
      io.getIO().emit(`get-create-order-${store}`, newOrder);
      io.getIO().emit("create-order-alarm");
      io.getIO().emit(`create-order-alarm-${store}`);

      //----SOCKET UPDATE CREATE ORDERS QUANTITY
      const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: new Types.ObjectId(store) }).lean();
      io.getIO().emit(`create-order-quantity-${store}`, createOrders.length);

      //----SOCKET UPDATE CREATE ORDERS WEIGHT
      const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
      io.getIO().emit(`create-order-weight-${store}`, createOrdersWeight);

      //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
      const createOrdersToday = await Order.find({ store });
      const now = new Date().getTime();
      const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
      const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
      const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
      const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

      let todayOrders;
      if (now <= endMorningToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
        );
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
        );
      } else {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
        );
      }
      const todayOrdersQuantity = todayOrders?.reduce(
        (total, order) => (total += order.quantity),
        0
      ).toFixed(1);
      io.getIO().emit(`get-today-orders-${store}`, { orders: todayOrders.length, todayOrdersQuantity });
    }
  } catch (err) {
    console.log(err);
    this.postCreateOrder(data);
  }
};

const startCreateTimerOrder = async (order) => {
  const { hours, minutes, second, date, month, year } = order.timer;
  const rule = new schedule.RecurrenceRule();
  rule.second = second;
  rule.minute = minutes;
  rule.hour = hours;
  rule.date = date;
  rule.month = month - 1;
  rule.year = year;
  rule.tz = "Asia/Saigon"
  schedule.scheduleJob(order.jobName, rule, async function () {
    await exports.postCreateOrder(order.createOrderData);
    await TimerOrder.findByIdAndUpdate(order._id, { status: 'approved' });
    const currentJob = schedule.scheduledJobs[order.jobName];
    currentJob?.cancel();
  });
}

exports.postCreateTimerOrder = async (req, res) => {
  const data = JSON.parse(req.body.data);
  const imageUrl = []
  if (req.file) {
    const formatPath = domain + req.file.path.replace("\\", "/");
    imageUrl.push(formatPath);
  }
  const checkTimer = await TimerOrder.findOne({ "timer.hours": data.timer.hours, "timer.minutes": data.timer.minutes, "timer.second": data.timer.second, "timer.date": data.timer.date, "timer.year": data.timer.year, "timer.month": data.timer.month });
  let timer = data.timer;
  if (checkTimer) {
    const sameDayTimer = await TimerOrder.find({ "timer.date": data.timer.date, "timer.year": data.timer.year, "timer.month": data.timer.month });
    for (let i = 0; i < sameDayTimer.length; i++) {
      if (timer.hours === sameDayTimer[i].timer.hours && timer.minutes === sameDayTimer[i].timer.minutes && timer.second === sameDayTimer[i].timer.second) {
        const getTime = getTimeFromString(5, timer.hours, timer.minutes, timer.second)
        timer = { ...data.timer, hours: String(getTime.hours), minutes: String(getTime.minutes), second: Number(getTime.second) }
      }
    }
  }
  const phone = extractPhone(data.createOrderData.detail);
  const checkShift = checkShiftTimeTimerOrder(timer.hours, timer.minutes, timer.date, timer.month, timer.year);
  const timerOrder = new TimerOrder(
    {
      createOrderData: { ...data.createOrderData, photoAttach: imageUrl },
      phone,
      timer,
      jobName: new Date().getTime(),
      status: 'pending',
      shiftCode: checkShift.morningShift ? 'S' : 'C',
      shiftDay: { date: checkShift.shiftDay.date, month: checkShift.shiftDay.month, year: checkShift.shiftDay.year }
    }
  );
  await timerOrder.save();
  startCreateTimerOrder(timerOrder);
  io.getIO().emit(`get-schedule-orders-quantity-${timerOrder.createOrderData.store}`);
  return res.end();
}

exports.postCreateOrderHttp = async (req, res) => {
  const { quantity, totalPrice, detail, payment, quickPurchase, creator, store, photoAttach, tag, app } = req.body;
  try {
    const imageUrl = []
    if (req.file) {
      const formatPath = domain + req.file.path.replace("\\", "/");
      imageUrl.push(formatPath);
    }
    // const storeById = await Store.findById(store);
    //----XỬ LÝ GỌI ĐIỆN THOẠI TRÍCH TỪ DETAIL
    const phone = extractPhone(detail);
    const date = new Date();
    const today = transformLocalDateString(date);
    const shiftWeek = getWeek();
    const user = await User.findById(creator);
    const createdAt =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);

    //-----CHECK SHIFT CODE-----
    let shiftCode;
    const checkShift = checkShiftTime();
    if (checkShift.morningShift === true) {
      shiftCode = "S";
    } else {
      shiftCode = "C";
    }

    const ordersByStore = await Order.find({ store }).lean().count();

    //----INDEX SHIFT BY SHIFT CODE-----
    let shiftIndex;
    if (ordersByStore === 0) {
      shiftIndex = 1;
    } else {
      if (shiftCode === 'S') {
        const morningShiftOrderToday = await Order.find({ shiftCode: 'S', shiftDay: checkShift.shiftDay, store }).lean();
        if (morningShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastMorningShiftOrderIndex = morningShiftOrderToday[morningShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastMorningShiftOrderIndex + 1;
        }
      }

      if (shiftCode === 'C') {
        const afternoonShiftOrderToday = await Order.find({ shiftCode: 'C', shiftDay: checkShift.shiftDay, store }).lean();
        if (afternoonShiftOrderToday.length === 0) {
          shiftIndex = 1;
        } else {
          const lastAfternoonShiftOrderIndex = afternoonShiftOrderToday[afternoonShiftOrderToday.length - 1].shiftIndex;
          shiftIndex = lastAfternoonShiftOrderIndex + 1;
        }
      }
    }

    if (quickPurchase === "true") {
      const status = "pending-produce-quick";
      const newQuickPurchaseOrder = new Order({
        quantity,
        totalPrice,
        detail,
        status,
        payment,
        quickPurchase,
        app,
        tag: tag && JSON.parse(tag),
        phone,
        store: new Types.ObjectId(store),
        photoAttach: imageUrl,
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + store,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        date: checkShift.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: checkShift.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: checkShift.shiftDay.slice(6, 8),
        shiftWeek,
        creator: { user, createdAt },
        producer: { user, produceStart: createdAt, produceEnd: createdAt },
        shipper: { user, shipStart: createdAt, shipEnd: createdAt, timeStamp: new Date(`${createdAt?.slice(0, 8)}, ${createdAt?.slice(11, 19)}`).getTime() }
      });
      await newQuickPurchaseOrder.save();
      const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
      const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
      const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
      const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
      const now = new Date().getTime();

      let todaySuccessOrders;
      if (now <= endMorningToday) {
        todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
      } else {
        todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean()
      };

      io.getIO().emit(`success-order-quantity-${store}`, todaySuccessOrders.length);
      const successOrdersWeight = todaySuccessOrders.reduce((total, order) => total += order.quantity, 0);
      io.getIO().emit(`success-order-weight-${store}`, (successOrdersWeight).toFixed(1));

      io.getIO().emit(`get-success-quick-order-${store}`, { newQuickPurchaseOrder, message: 'Tạo đơn hàng nhanh thành công!' });

      // ---- SEND NOTIFICATION
      await notification.send(store, req.user?.userId, constant.notification.common.title, `Đơn nhanh ${shiftCode}${shiftIndex} đã tạo.`, constant.notification.success.status);

      return res.end();
    }
    else {
      if (user.role?.toString() === "643cf0b3162c633b558c08dc") {
        return;
      }
      const status = "create";
      const newOrder = new Order({
        quantity,
        totalPrice,
        detail,
        status,
        payment,
        quickPurchase,
        app,
        tag: tag && JSON.parse(tag),
        phone,
        store: new Types.ObjectId(store),
        photoAttach: imageUrl,
        uniqueCode: checkShift.shiftDay + shiftCode + shiftIndex + store,
        shiftCode,
        shiftIndex,
        shiftDay: checkShift.shiftDay,
        date: checkShift.shiftDay.slice(3, 5)[0] === "0" ? checkShift.shiftDay.slice(4, 5) : checkShift.shiftDay.slice(3, 5),
        month: checkShift.shiftDay.slice(0, 2)[0] === "0" ? checkShift.shiftDay.slice(1, 2) : checkShift.shiftDay.slice(0, 2),
        year: checkShift.shiftDay.slice(6, 8),
        shiftWeek,
        creator: { user, createdAt },
        edited: {
          value: false,
          count: 0
        }
      });
      await newOrder.save();
      io.getIO().emit(`get-create-order-${store}`, newOrder);
      io.getIO().emit("create-order-alarm");
      io.getIO().emit(`create-order-alarm-${store}`);

      //----SOCKET UPDATE CREATE ORDERS QUANTITY
      const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: new Types.ObjectId(store) }).lean();
      io.getIO().emit(`create-order-quantity-${store}`, createOrders.length);

      //----SOCKET UPDATE CREATE ORDERS WEIGHT
      const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
      io.getIO().emit(`create-order-weight-${store}`, createOrdersWeight);

      //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
      const createOrdersToday = await Order.find({ store }).lean();
      const now = new Date().getTime();
      const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
      const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
      const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
      const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

      let todayOrders;
      if (now <= endMorningToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
        );
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
        );
      } else {
        todayOrders = createOrdersToday.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
        );
      }
      const todayOrdersQuantity = todayOrders?.reduce(
        (total, order) => (total += order.quantity),
        0
      ).toFixed(1);
      io.getIO().emit(`get-today-orders-${store}`, { orders: todayOrders.length, todayOrdersQuantity });
      // storeById.todayStoreOrders = todayOrders.length;
      // storeById.todayStoreQuantity = todayOrdersQuantity;
      // storeById.dateRecord = checkShift.shiftDay;
      // await storeById.save();

      // ---- SEND NOTIFICATION
      await notification.send(store, req.user?.userId, constant.notification.common.title, `Đơn ${shiftCode}${shiftIndex} đã tạo.`, constant.notification.create.status);

      // const newOrderInfo = new Order({
      //   quantity,
      //   totalPrice,
      //   detail,
      //   status,
      //   payment,
      //   quickPurchase,
      //   tag: tag === null ? [] : tag,
      //   phone,
      //   store: new Types.ObjectId(store),
      //   photoAttach,
      //   shiftCode,
      //   shiftIndex,
      //   shiftDay: checkShift.shiftDay,
      //   shiftWeek,
      //   creator: { user: user._id, createdAt },
      //   edited: {
      //     value: false,
      //     count: 0
      //   }
      // });

      // backupEmailData(store, `Tạo đơn hàng mới ${checkShift.shiftDay}`,
      //   `<p><b>Ca:</b> ${shiftCode}${shiftIndex}-${checkShift.shiftDay}</p>
      //   <p><b>Người tạo:</b> ${user.name}</p>
      //   <p><b>Thời gian:</b> ${createdAt}</p>
      //   <p><b>Số lượng:</b> ${quantity}kg</p>
      //   <p><b>Tiền:</b> ${totalPrice.toLocaleString()}đ</p>
      //   <p><b>Thông tin:</b> ${detail}</p>
      //   <p><b>Dữ liệu:</b></p>
      // ${JSON.stringify(newOrderInfo)}`);
      return res.end();
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Có lỗi xảy ra trong quá trình tạo đơn, vui lòng thử lại." });
  }
};



exports.updateOrder = async (req, res) => {
  const { id, serviceIndex, quantity, totalPrice, detail, payment, app, store, editor, tag, photoAttach } = req.body;
  const phone = extractPhone(detail);
  try {
    const findUpdateOrder = await UpdatedOrder.find({ originalId: id }).lean();

    const updateOrder = await Order.findById(id).populate({
      path: "creator",
      populate: "user",
    })
      .populate({
        path: "producer",
        populate: "user",
      })
      .populate({
        path: "shipper",
        populate: "user",
      })
      .populate({
        path: "confirmShip",
        populate: "user",
      }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });

    if (findUpdateOrder.length === 0) {
      const originalOrder = new UpdatedOrder({
        originalId: id,
        store,
        orderData:
          updateOrder
      })
      await originalOrder.save();
      if (updateOrder.quantity !== quantity || updateOrder.totalPrice !== totalPrice || updateOrder.detail !== detail || updateOrder.payment !== payment || updateOrder.app !== app || updateOrder.tag.toString() !== tag.toString()) {
        updateOrder.quantity = quantity;
        updateOrder.totalPrice = totalPrice;
        updateOrder.detail = detail;
        updateOrder.phone = phone;
        updateOrder.payment = payment;
        updateOrder.app = app;
        const imageUrl = updateOrder.photoAttach;
        if (req.file) {
          const formatPath = domain + req.file.path.replace("\\", "/");
          imageUrl.push(formatPath);
        }
        updateOrder.photoAttach = imageUrl;
        updateOrder.tag = tag === "" ? [] : JSON.parse(tag);
        updateOrder.edited = {
          value: true,
        }
        await updateOrder.save();

        const newUpdatedOrder = new UpdatedOrder({
          originalId: id,
          store,
          timeStamp: transformLocalTimeString(new Date()),
          editor: new Types.ObjectId(editor),
          orderData:
            updateOrder
        })
        await newUpdatedOrder.save();
      }
    }
    else {
      if (updateOrder.quantity !== quantity || updateOrder.totalPrice !== totalPrice || updateOrder.detail !== detail || updateOrder.payment !== payment || updateOrder.app !== app || updateOrder.tag.toString() !== tag.toString()) {
        updateOrder.quantity = quantity;
        updateOrder.totalPrice = totalPrice;
        updateOrder.detail = detail;
        updateOrder.phone = phone;
        updateOrder.payment = payment;
        updateOrder.app = app;
        const imageUrl = JSON.parse(photoAttach);
        if (req.file) {
          const formatPath = domain + req.file.path.replace("\\", "/");
          imageUrl.push(formatPath);
        }
        updateOrder.photoAttach = imageUrl;
        updateOrder.tag = tag === "" ? [] : JSON.parse(tag);
        updateOrder.edited = {
          value: true,
        }
        await updateOrder.save();

        const newUpdatedOrder = new UpdatedOrder({
          originalId: id,
          store,
          timeStamp: transformLocalTimeString(new Date()),
          editor: new Types.ObjectId(editor),
          orderData:
            updateOrder
        })
        await newUpdatedOrder.save();
      }
    }

    io.getIO().emit(`get-update-order-${store}`, updateOrder);

    if (updateOrder.shippingService.serviceName) {
      io.getIO().emit(`get-update-start-shipping-service-order-${store}`, { order: updateOrder, serviceIndex });
    }

    // ---- SEND NOTIFICATION
    await notification.send(store, req.user?.userId, constant.notification.common.title, `Đơn ${updateOrder.shiftCode}${updateOrder.shiftIndex} đã cập nhật thông tin.`, updateOrder.status);

    // const updateOrderInfo = await Order.findById(id);
    // const editorInfo = await User.findById(editor);

    // backupEmailData(store, `Chỉnh sửa đơn hàng ${updateOrderInfo.shiftDay}`,
    //   `<p><b>Ca:</b> ${updateOrderInfo.shiftCode}${updateOrderInfo.shiftIndex}-${updateOrderInfo.shiftDay}</p>
    //     <p><b>Người chỉnh sửa:</b> ${editorInfo.name}</p>
    //     <p><b>Thời gian:</b> ${new Date().toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
    //     <p><b>Số lượng:</b> ${quantity}kg</p>
    //     <p><b>Tiền:</b> ${totalPrice.toLocaleString()}đ</p>
    //     <p><b>Thông tin:</b> ${detail}</p>
    //     <p><b>Hình ảnh:</b> ${updateOrderInfo.photoAttach.map((photo) => `${photo}, `)}</p> 
    //     <p><b>Dữ liệu:</b></p>
    // ${JSON.stringify(updateOrderInfo)}`);
    return res.end()
  } catch (err) {
    console.log(err);
  }
}

exports.deleteCreateOrder = async (data) => {
  const date = new Date();
  const today = transformLocalDateString(date);
  const { orderId, deletor, storeId } = data;
  try {
    const deleteOrder = await Order.findById(orderId);

    const deletedOrder = new DeletedOrder({
      deletor: new Types.ObjectId(deletor),
      orderData: deleteOrder,
      timeStamp: transformLocalTimeString(new Date()),
      store: storeId
    });
    await deletedOrder.save();

    await Order.findByIdAndDelete(orderId);
    io.getIO().emit('get-delete-create-order', deleteOrder);
    const store = deleteOrder.store;
    //----SOCKET UPDATE CREATE ORDERS QUANTITY
    const createOrdersQuantity = await Order.find({ status: "create", store }).count();
    io.getIO().emit(`create-order-quantity-${store}`, createOrdersQuantity);

    //----SOCKET UPDATE CREATE ORDERS WEIGHT
    const createOrders = await Order.find({ status: "create", store });
    const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`create-order-weight-${store}`, createOrdersWeight);

    //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
    const createOrdersToday = await Order.find({ store });
    const now = new Date().getTime();
    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

    let todayOrders;
    if (now <= endMorningToday) {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
      );
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
      );
    } else {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
      );
    }
    const todayOrdersQuantity = todayOrders?.reduce(
      (total, order) => (total += order.quantity),
      0
    ).toFixed(1);

    // const deletorInfo = await User.findById(deletor);
    // backupEmailData(storeId, `Xóa đơn hàng mới tạo ${deleteOrder.shiftDay}`,
    //   `<p><b>Ca:</b> ${deleteOrder.shiftCode}${deleteOrder.shiftIndex}-${deleteOrder.shiftDay}</p>
    //     <p><b>Người xóa:</b> ${deletorInfo.name}</p>
    //     <p><b>Thời gian:</b> ${new Date().toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
    //     <p><b>Số lượng:</b> ${deleteOrder.quantity}kg</p>
    //     <p><b>Tiền:</b> ${deleteOrder.totalPrice.toLocaleString()}đ</p>
    //     <p><b>Thông tin:</b> ${deleteOrder.detail}</p>
    //     <p><b>Hình ảnh:</b> ${deleteOrder.photoAttach.map((photo) => `${photo}, `)}</p>
    //     <p><b>Dữ liệu:</b></p>
    //     ${JSON.stringify(deletedOrder)}`);
  } catch (err) {
    console.log(err);
  }
}

exports.waitConfirmDeleteOrder = async (data) => {
  const { orderId, deletor, storeId, deleteReason, serviceIndex } = data;
  try {
    const deleteOrder = await Order.findById(orderId).populate({ path: 'producer', populate: 'user' }).populate({ path: 'shipper', populate: 'user' });
    let orderStatus = 1;
    if (deleteOrder.status === 'produce') {
      deleteOrder.status = "pending-delete-produce";
      orderStatus = 2;
    } else if (deleteOrder.status === 'ship') {
      deleteOrder.status = "pending-delete-ship";
      orderStatus = 3;
    } else if (deleteOrder.status === 'success') {
      deleteOrder.status = "pending-delete-success";
      orderStatus = 4;
    }

    deleteOrder.deleteReason = deleteReason;
    deleteOrder.deletor = new Types.ObjectId(deletor);
    await deleteOrder.save();

    console.log(storeId, deletor, constant.notification.common.title, orderStatus);

    // ---- SEND NOTIFICATION
    await notification.send(storeId, deletor, constant.notification.common.title, `Đơn ${deleteOrder.shiftCode}${deleteOrder.shiftIndex} gửi yêu cầu huỷ.`, orderStatus.toString());

    io.getIO().emit(`get-pending-produce-delete-order-${storeId}`, deleteOrder);
    if (deleteOrder.shippingService.serviceName) {
      io.getIO().emit(`get-update-start-shipping-service-order-${storeId}`, { order: deleteOrder, serviceIndex });
    }
    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
  } catch (err) {
    console.log(err);
  }
}

exports.undoDeleteOrder = async (req, res) => {
  const { orderId } = req.body;
  const { storeId } = req.params;
  try {
    const deleteOrder = await Order.findById(orderId).populate({ path: 'producer', populate: 'user' }).populate({ path: 'shipper', populate: 'user' });
    if (deleteOrder.status === 'pending-delete-produce') {
      deleteOrder.status = "produce";
    } else if (deleteOrder.status === 'pending-delete-ship') {
      deleteOrder.status = "ship";
    } else if (deleteOrder.status === 'pending-delete-success') {
      deleteOrder.status = "success";
    }
    await deleteOrder.save();
    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.undoPendingProduceOrder = async (req, res) => {
  const { id } = req.body;
  try {
    const order = await Order.findById(id).populate({ path: 'producer', populate: 'user' }).populate({ path: 'shipper', populate: 'user' });
    order.status = 'create';
    order.producer.user = undefined;
    await order.save();

    // ---- SEND NOTIFICATION
    await notification.send(order?.store, req.user?.userId, constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} không được duyệt xuất kho.`, constant.notification.create.status);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.deleteProduceOrder = async (data) => {
  const date = new Date();
  const today = transformLocalDateString(date)
  const { orderId, deletor, storeId, user } = data;
  try {
    const deleteOrder = await Order.findById(orderId);

    const deletedOrder = new DeletedOrder({
      deletor: new Types.ObjectId(deletor),
      orderData: deleteOrder,
      timeStamp: transformLocalTimeString(new Date()),
      store: storeId
    });
    await deletedOrder.save();

    await Order.findByIdAndDelete(orderId);
    io.getIO().emit(`get-pending-delete-order-${storeId}`, deleteOrder);
    io.getIO().emit('get-delete-produce-order', deleteOrder);

    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });

    const cookedHistory = new CookedHistory({
      action: 'reImportCooked',
      quantity: deleteOrder.quantity,
      orderId,
      shiftDay: deleteOrder.shiftDay,
      shiftCode: deleteOrder.shiftCode,
      shiftIndex: deleteOrder.shiftIndex,
      store: new Types.ObjectId(storeId),
      timeStamp: transformLocalTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(user),
      cookedBalance: subStock.cookedInventory + deleteOrder.quantity
    });
    await cookedHistory.save();

    await SubStock.updateOne({ store: storeId }, { $set: { cookedInventory: cookedHistory.cookedBalance } })


    const store = deleteOrder.store;

    const produceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: new Types.ObjectId(store) }).lean();
    io.getIO().emit(`produce-order-quantity-${store}`, produceOrders.length);

    const produceOrdersWeight = produceOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`produce-order-weight-${store}`, produceOrdersWeight);

    //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
    const createOrdersToday = await Order.find({ store });
    const now = new Date().getTime();
    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

    let todayOrders;
    if (now <= endMorningToday) {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
      );
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
      );
    } else {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
      );
    }
    const todayOrdersQuantity = todayOrders?.reduce(
      (total, order) => (total += order.quantity),
      0
    ).toFixed(1);
    // const deletorInfo = await User.findById(deletor);
    // backupEmailData(storeId, `Xóa đơn hàng đang xử lý ${deleteOrder.shiftDay}`,
    //   `<p><b>Ca:</b> ${deleteOrder.shiftCode}${deleteOrder.shiftIndex}-${deleteOrder.shiftDay}</p>
    // <p><b>Người xóa:</b> ${deletorInfo.name}</p>
    // <p><b>Thời gian:</b> ${new Date().toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
    // <p><b>Số lượng:</b> ${deleteOrder.quantity}kg</p>
    // <p><b>Tiền:</b> ${deleteOrder.totalPrice.toLocaleString()}đ</p>
    // <p><b>Thông tin:</b> ${deleteOrder.detail}</p>
    // <p><b>Hình ảnh:</b> ${deleteOrder.photoAttach.map((photo) => `${photo}, `)}</p>
    // <p><b>Dữ liệu:</b></p>
    // ${JSON.stringify(deletedOrder)}`);
  } catch (err) {
    console.log(err);
  }
}

exports.deleteShipOrder = async (data) => {
  const date = new Date();
  const today = transformLocalDateString(date)
  const { orderId, deletor, storeId, user } = data;
  try {
    const deleteOrder = await Order.findById(orderId);

    const deletedOrder = new DeletedOrder({
      deletor: new Types.ObjectId(deletor),
      orderData: deleteOrder,
      timeStamp: transformLocalTimeString(new Date()),
      store: storeId
    });
    await deletedOrder.save();

    await Order.findByIdAndDelete(orderId);
    io.getIO().emit(`get-pending-delete-order-${storeId}`, deleteOrder);
    io.getIO().emit('get-delete-ship-order', deleteOrder);

    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });

    const cookedHistory = new CookedHistory({
      action: 'reImportCooked',
      quantity: deleteOrder.quantity,
      orderId,
      shiftDay: deleteOrder.shiftDay,
      shiftCode: deleteOrder.shiftCode,
      shiftIndex: deleteOrder.shiftIndex,
      store: new Types.ObjectId(storeId),
      timeStamp: transformLocalTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(user),
      cookedBalance: subStock.cookedInventory + deleteOrder.quantity
    });

    await SubStock.updateOne({ store: storeId }, { $set: { cookedInventory: cookedHistory.cookedBalance } })

    const store = deleteOrder.store;

    //----SOCKET ĐƠN HÀNG ĐANG GIAO
    const shipOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: new Types.ObjectId(store) });
    const pendingShipOrders = shipOrders.filter(order => order.shipper.shipEnd === undefined);
    io.getIO().emit(`ship-order-quantity-${store}`, pendingShipOrders.length);

    const shipOrdersWeight = pendingShipOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`ship-order-weight-${store}`, shipOrdersWeight);

    //----SOCKET UPDATE TODAY CREATE ORDERS WEIGHT
    const createOrdersToday = await Order.find({ store });
    const now = new Date().getTime();
    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;

    let todayOrders;
    if (now <= endMorningToday) {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningToday
      );
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endAfternoonToday
      );
    } else {
      todayOrders = createOrdersToday.filter(
        (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
      );
    }
    // const deletorInfo = await User.findById(deletor);
    // backupEmailData(storeId, `Xóa đơn hàng đang giao ${deleteOrder.shiftDay}`,
    //   `<p><b>Ca:</b> ${deleteOrder.shiftCode}${deleteOrder.shiftIndex}-${deleteOrder.shiftDay}</p>
    // <p><b>Người xóa:</b> ${deletorInfo.name}</p>
    // <p><b>Thời gian:</b> ${new Date().toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
    // <p><b>Số lượng:</b> ${deleteOrder.quantity}kg</p>
    // <p><b>Tiền:</b> ${deleteOrder.totalPrice.toLocaleString()}đ</p>
    // <p><b>Thông tin:</b> ${deleteOrder.detail}</p>
    // <p><b>Hình ảnh:</b> ${deleteOrder.photoAttach.map((photo) => `${photo}, `)}</p>
    // <p><b>Dữ liệu:</b></p>
    // ${JSON.stringify(deletedOrder)}`);
  } catch (err) {
    console.log(err);
  }
}

exports.waitConfirmSellExport = async (data) => {
  const { producerId, orderId, store } = data;
  try {
    const order = await Order.findById(orderId).populate({ path: 'creator', populate: 'user' }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });
    if (order.producer.user !== undefined) {
      return;
    }
    const user = await User.findById(producerId);
    order.producer = { user, produceStart: undefined };
    order.status = "pending-produce";
    await order.save();

    // ---- SEND NOTIFICATION
    await notification.send(store, producerId, constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} yêu cầu duyệt xuất kho.`, constant.notification.create.status);

    io.getIO().emit(`get-pending-produce-order-${store}`, order);
  } catch (err) {
    console.log(err);
  }
}

exports.confirmQuickOrderHttp = async (req, res) => {
  const { orderId, userId, store } = req.body;
  await SubStock.updateOne({ store }, { $set: { updatedBy: req.user.userId } });
  try {
    const confirmCheckStock = await CookedHistory.findOne({ action: 'checkProductStock', store: new Types.ObjectId(store) }).sort({ _id: -1 }).limit(1).populate('user');
    if (confirmCheckStock) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho chín' });
    }
    const checkStockUpdateUser = await SubStock.findOne({ store, updatedBy: req.user.userId });
    if (checkStockUpdateUser) {
      const quickOrder = await Order.findById(orderId).populate({ path: 'creator', populate: 'user' });
      if (+(quickOrder.quantity - checkStockUpdateUser.cookedInventory).toFixed(4) > 0.0000) {
        return res.json({ message: 'Không đủ số lượng nem' });
      }
      quickOrder.status = "success";
      await quickOrder.save();

      if (quickOrder) {
        const soldHistory = new SoldHistory({
          action: 'soldProduct',
          quantity: quickOrder.quantity,
          orderId,
          shiftDay: quickOrder.shiftDay,
          shiftCode: quickOrder.shiftCode,
          shiftIndex: quickOrder.shiftIndex,
          store: new Types.ObjectId(store),
          timeStamp: transformLocalDateTimeString(new Date()),
          timeStampHistory: Date.now(),
          user: new Types.ObjectId(userId),
          cookedBalance: checkStockUpdateUser.cookedInventory - quickOrder.quantity
        });
        await soldHistory.save();
        await SubStock.updateOne({ store, updatedBy: req.user.userId }, { $inc: { cookedInventory: - quickOrder.quantity } })
      }

      const date = new Date();
      const today = transformLocalDateString(date)
      const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
      const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
      const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
      const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
      const now = new Date().getTime();

      let todaySuccessOrders;
      if (now <= endMorningToday) {
        todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean()
      } else {
        todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: req.user.store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean()
      };
      io.getIO().emit(`success-order-quantity-${store}`, todaySuccessOrders.length);
      const successOrdersWeight = todaySuccessOrders.reduce((total, order) => total += order.quantity, 0);

      io.getIO().emit(`success-order-weight-${store}`, (successOrdersWeight).toFixed(1));
      io.getIO().emit("create-order-alarm");
      io.getIO().emit(`create-order-alarm-${store}`);

      const createOrders = await Order.find({ store });

      let todayOrders;
      if (now <= endMorningToday) {
        todayOrders = createOrders.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= startMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() <= endMorningToday
        );
      }
      else if (now > endMorningToday && now <= endAfternoonToday) {
        todayOrders = createOrders.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() >= endMorningToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() <= endAfternoonToday
        );
      } else {
        todayOrders = createOrders.filter(
          (order) => new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() > endAfternoonToday && new Date(`${order.creator.createdAt?.slice(0, 8)}, ${order.creator.createdAt?.slice(11, 19)}`).getTime() < endMorningNextDay
        );
      }
      const todayOrdersQuantity = todayOrders?.reduce(
        (total, order) => (total += order.quantity),
        0
      ).toFixed(1);
      io.getIO().emit(`get-today-orders-${store}`, { orders: todayOrders.length, todayOrdersQuantity });

      // const newQuickPurchaseOrderInfo = {
      //   quantity: quickOrder.quantity,
      //   totalPrice: quickOrder.totalPrice,
      //   detail: quickOrder.detail,
      //   status: quickOrder.status,
      //   payment: quickOrder.payment,
      //   quickPurchase: quickOrder.quickPurchase,
      //   tag: quickOrder.tag,
      //   phone: quickOrder.phone,
      //   store: new Types.ObjectId(store),
      //   photoAttach: quickOrder.photoAttach,
      //   shiftCode: quickOrder.shiftCode,
      //   shiftIndex: quickOrder.shiftIndex,
      //   shiftDay: quickOrder.shiftDay,
      //   shiftWeek: quickOrder.shiftWeek,
      //   creator: { user: quickOrder.creator.user._id, createdAt: quickOrder.creator.createdAt },
      //   producer: { user: quickOrder.producer.user._id, produceStart: quickOrder.producer.createdAt, produceEnd: quickOrder.producer.createdAt },
      //   shipper: { user: quickOrder.shipper.user._id, shipStart: quickOrder.producer.createdAt, shipEnd: quickOrder.producer.createdAt }
      // };
      // backupEmailData(store, `Tạo đơn hàng nhanh ${quickOrder.shiftDay}`,
      //   `<p><b>Ca:</b> ${quickOrder.shiftCode}${quickOrder.shiftIndex}-${quickOrder.shiftDay}</p>
      //     <p><b>Người tạo:</b> ${quickOrder.creator.user.name}</p>
      //     <p><b>Thời gian:</b> ${quickOrder.creator.createdAt}</p>
      //     <p><b>Số lượng:</b> ${quickOrder.quantity}kg</p>
      //     <p><b>Tiền:</b> ${quickOrder.totalPrice.toLocaleString()}đ</p>
      //     <p><b>Thông tin:</b> ${quickOrder.detail}</p>
      //     <p><b>Dữ liệu:</b></p>
      //   ${JSON.stringify(newQuickPurchaseOrderInfo)}`);
      return res.end();
    } else {
      return res.end();
    }
  } catch (err) {
    console.log(err);
  }

}

exports.postStartProduceOrderHttp = async (req, res) => {
  const { orderId, store, userId } = req.body;
  await SubStock.updateOne({ store }, { $set: { updatedBy: req.user.userId } });
  try {
    const confirmCheckStock = await CookedHistory.findOne({ action: 'checkProductStock', store: new Types.ObjectId(store) }).sort({ _id: -1 }).limit(1).populate('user');
    if (confirmCheckStock) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho chín' });
    }

    const checkStockUpdateUser = await SubStock.findOne({ store, updatedBy: req.user.userId });
    if (checkStockUpdateUser) {

      const order = await Order.findById(orderId);

      if (order.producer.user && order.producer.produceStart) {
        return res.end();
      }

      if (+(order.quantity - checkStockUpdateUser.cookedInventory).toFixed(4) > 0.0000) {
        return res.json({ message: 'Không đủ số lượng nem' });
      }
      const date = new Date(Date.now());
      const produceStart =
        transformLocalDateString(date) +
        " - " +
        transformLocalTimeString(date);
      order.producer.produceStart = produceStart;
      order.status = "produce";
      await order.save();

      if (order) {
        const soldHistory = new SoldHistory({
          action: 'soldProduct',
          quantity: order.quantity,
          orderId,
          shiftDay: order.shiftDay,
          shiftCode: order.shiftCode,
          shiftIndex: order.shiftIndex,
          store: new Types.ObjectId(store),
          timeStamp: transformLocalDateTimeString(new Date()),
          timeStampHistory: Date.now(),
          user: new Types.ObjectId(userId),
          cookedBalance: checkStockUpdateUser.cookedInventory - order.quantity
        });

        await soldHistory.save();
        await SubStock.updateOne({ store, updatedBy: req.user.userId }, { $inc: { cookedInventory: - order.quantity } })
      }

      const subStock = await SubStock.findOne({ store });
      if (subStock.cookedInventory <= 0.01) {
        await SubStock.updateOne({ store, updatedBy: req.user.userId }, { cookedInventory: 0 })
      }

      const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: new Types.ObjectId(store) }).lean();
      io.getIO().emit(`create-order-quantity-${store}`, createOrders.length);

      //----SOCKET UPDATE CREATE ORDERS WEIGHT
      const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
      io.getIO().emit(`create-order-weight-${store}`, createOrdersWeight);

      //----SOCKET ĐƠN HÀNG ĐANG XỬ LÝ
      const produceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: new Types.ObjectId(store) }).lean().populate({
        path: "producer",
        populate: "user",
      });
      io.getIO().emit(`produce-order-quantity-${store}`, produceOrders.length);
      const produceOrdersWeight = produceOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
      io.getIO().emit(`produce-order-weight-${store}`, produceOrdersWeight);

      io.getIO().emit(`get-end-create-order-${store}`, order);
      io.getIO().emit(`get-start-produce-order-${store}`, produceOrders);


      // ---- SEND NOTIFICATION
      await notification.send(store, req.user?.userId, constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} đã xuất kho - đang xử lý.`, constant.notification.produce.status);

      // const orderInfo = await Order.findById(orderId);

      // backupEmailData(store, `Nhận xử lý đơn hàng ${orderInfo.shiftDay}`,
      //   `<p><b>Ca:</b> ${orderInfo.shiftCode}${orderInfo.shiftIndex}-${orderInfo.shiftDay}</p>
      //   <p><b>Người nhận xử lý:</b> ${user.name}</p>
      //   <p><b>Thời gian:</b> ${produceStart}</p>
      //   <p><b>Số lượng:</b> ${orderInfo.quantity}kg</p>
      //   <p><b>Tiền:</b> ${orderInfo.totalPrice.toLocaleString()}đ</p>
      //   <p><b>Thông tin:</b> ${orderInfo.detail}</p>
      //   <p><b>Hình ảnh:</b> ${orderInfo.photoAttach.map((photo) => `${photo}, `)}</p>
      //   <p><b>Dữ liệu:</b></p>
      //   ${JSON.stringify(orderInfo)}`);
      return res.end();
    } else {
      return res.end();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postEndProduceOrder = async (data) => {
  const { orderId, store } = data;
  try {
    const order = await Order.findById(orderId).populate({
      path: "producer",
      populate: "user",
    });
    if (order.shipper.user && order.shipper.shipStart || order.status === "pending-delete-produce") {
      return res.end();
    }
    const date = new Date(Date.now());
    const produceEnd =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);
    order.producer = { ...order.producer, produceEnd };
    await order.save();
    const produceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: new Types.ObjectId(store) }).lean();
    io.getIO().emit(`produce-order-quantity-${store}`, produceOrders.length);

    const produceOrdersWeight = produceOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`produce-order-weight-${store}`, produceOrdersWeight);
    io.getIO().emit(`get-end-produce-order-${store}`, order);
    if (order.shippingService.serviceName) {
      io.getIO().emit(`get-end-produce-shipping-service-order-${store}`, { order, serviceIndex: data.serviceIndex });
    }

    const user = await User.findById(order.producer.user);

    // ---- SEND NOTIFICATION
    await notification.send(store, user._id, constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} hoàn thành xử lí - chờ giao hàng.`, constant.notification.produce.status);

    // const orderInfo = await Order.findById(orderId);

    // backupEmailData(store, `Hoàn thành xử lý đơn hàng ${orderInfo.shiftDay}`,
    //   `<p><b>Ca:</b> ${orderInfo.shiftCode}${orderInfo.shiftIndex}-${orderInfo.shiftDay}</p>
    // <p><b>Người nhận xử lý:</b> ${user.name}</p>
    // <p><b>Thời gian:</b> ${produceEnd}</p>
    // <p><b>Số lượng:</b> ${orderInfo.quantity}kg</p>
    // <p><b>Tiền:</b> ${orderInfo.totalPrice.toLocaleString()}đ</p>
    // <p><b>Thông tin:</b> ${orderInfo.detail}</p>
    // <p><b>Hình ảnh:</b> ${orderInfo.photoAttach.map((photo) => `${photo}, `)}</p>
    // <p><b>Dữ liệu:</b></p>
    // ${JSON.stringify(orderInfo)}`
    // );
  } catch (err) {
    console.log(err);
  }
};

exports.handleShippingFee = async (req, res) => {
  const { shippingFee, orderId } = req.body;
  try {
    const order = await Order.findById(orderId).populate({ path: 'shippingService', populate: "user" });
    if ((order.shippingService.user && order.shippingService.user?._id.toString() !== req.user.userId) || order.status !== 'produce') {
      return res.json({ message: 'Đơn hàng đã có người khác xử lý' });
    }
    order.shippingFee = shippingFee;
    await order.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.updateShippingFee = async (req, res) => {
  const { shippingFee, orderId, serviceIndex } = req.body;
  try {
    const order = await Order.findById(orderId).populate({ path: 'producer', populate: 'user' }).populate({ path: 'shipper', populate: 'user' }).populate({ path: 'shippingService', populate: "user" });
    order.shippingFee = shippingFee;
    await order.save();
    io.getIO().emit(`get-update-start-shipping-service-order-${req.user.store._id}`, { order, serviceIndex });
    return res.end();
  } catch (err) {
    console.log(err);
  }
}


exports.handleShippingService = async (req, res) => {
  const { orders, shippingService } = req.body;
  try {
    orders.forEach(async id => {
      const order = await Order.findById(id).populate({ path: 'shippingService', populate: 'user' });
      if ((order.shippingService.user && order.shippingService.user?._id.toString() !== req.user.userId)) {
        return res.json({ message: 'Đơn hàng đã có người khác xử lý' });
      }
    })
    const findShippingService = await ShippingService.findById(shippingService);
    await Order.updateMany({ $or: [{ _id: [...orders] }] }, { "shippingService.serviceName": findShippingService.name, "shippingService.user": new Types.ObjectId(req.user.userId), "shippingService.timeStamp": Date.now() })
    orders.forEach(id => {
      io.getIO().emit(`handle-shipping-service-order-${req.user.store._id}`, id);
    });

    const shippingServiceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: req.user.store, shippingService: { $nin: [undefined] } })
      .populate({
        path: "producer",
        populate: "user",
      }).populate({ path: "shippingService", populate: "user" });

    const timeStampSet = new Set(shippingServiceOrders.map(order => order.shippingService.timeStamp));
    const timeStampArray = Array.from(timeStampSet);

    const shippingServiceOrdersResponse = []
    timeStampArray.forEach(timeStamp => {
      const order = shippingServiceOrders.filter(order => order.shippingService.timeStamp === timeStamp);
      shippingServiceOrdersResponse.push({ order, timeStamp });
    })

    io.getIO().emit(`get-start-shipping-service-order-${req.user.store._id}`, shippingServiceOrdersResponse);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.undoShippingService = async (req, res) => {
  const { orderId } = req.body;
  try {
    const order = await Order.findById(orderId).populate({ path: 'producer', populate: 'user' });
    order.shippingFee = undefined;
    order.shippingService = undefined;
    await order.save();
    io.getIO().emit(`undo-shipping-service-order-${req.user.store._id}`, order);
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.startShippingServiceOrders = async (req, res) => {
  try {
    const { timeStamp } = req.body;
    const date = new Date(Date.now());
    const shipStart =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);
    const findUnfinishedProducingShippingServiceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], "producer.produceEnd": undefined, "shippingService.timeStamp": timeStamp });
    if (findUnfinishedProducingShippingServiceOrders.length > 0) {
      return res.json({ message: 'Chưa xử lý xong đơn hàng' });
    }
    const findPendingDeleteProducingShippingServiceOrders = await Order.find({ status: "pending-delete-produce", "shippingService.timeStamp": timeStamp });
    if (findPendingDeleteProducingShippingServiceOrders.length > 0) {
      return res.json({ message: 'Có đơn hàng đang chờ hủy' });
    }
    const findEndProducingShippingServiceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], "producer.produceEnd": { $nin: [undefined] }, "shippingService.timeStamp": timeStamp });
    if (findEndProducingShippingServiceOrders.length === 0) {
      return res.json({ message: 'Đơn hàng đã được người khác giao' });
    }

    // ---- SEND NOTIFICATION
    const orderData = await Order.find({ status: "produce", "producer.produceEnd": { $nin: [undefined] }, "shippingService.timeStamp": timeStamp });
    const confirmUser = await User.findById(req.user?.userId);
    if (confirmUser) {
      await notification.send(req.user.store._id, req.user?.userId, constant.notification.common.title, `Đơn ${orderData[0]?._id} được nhận giao bởi ${confirmUser?.name}.`, constant.notification.ship.status);
    } else {
      await notification.send(req.user.store._id, req.user?.userId, constant.notification.common.title, `Đơn ${orderData[0]?._id} được nhận giao bởi đơn vị ${orderData[0]?.shippingService?.serviceName}.`, constant.notification.ship.status);
    }

    await Order.updateMany({ status: "produce", "producer.produceEnd": { $nin: [undefined] }, "shippingService.timeStamp": timeStamp }, { status: "ship", "shipper.shipStart": shipStart, "shipper.user": new Types.ObjectId(req.user.userId) });

    const shippingServiceOrders = await Order.find({ status: "produce", store: req.user.store, shippingService: { $nin: [undefined] } })
      .populate({
        path: "producer",
        populate: "user",
      }).populate({ path: "shippingService", populate: "user" });

    const timeStampSet = new Set(shippingServiceOrders.map(order => order.shippingService.timeStamp));
    const timeStampArray = Array.from(timeStampSet);

    const shippingServiceOrdersResponse = []
    timeStampArray.forEach(timeStamp => {
      const order = shippingServiceOrders.filter(order => order.shippingService.timeStamp === timeStamp);
      shippingServiceOrdersResponse.push({ order, timeStamp });
    })

    io.getIO().emit(`get-start-shipping-service-order-${req.user.store._id}`, shippingServiceOrdersResponse);

    const startShippingServiceOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: req.user.store, shippingService: { $nin: [undefined] } })
      .populate({
        path: "shipper",
        populate: "user",
      }).populate({ path: "shippingService", populate: "user" });

    const timeStampServiceSet = new Set(startShippingServiceOrders.map(order => order.shippingService.timeStamp));
    const timeStampServiceArray = Array.from(timeStampServiceSet);

    const startShippingServiceOrdersResponse = []
    timeStampServiceArray.forEach(timeStamp => {
      const order = startShippingServiceOrders.filter(order => order.shippingService.timeStamp === timeStamp);
      startShippingServiceOrdersResponse.push({ order, timeStamp });
    });
    io.getIO().emit(`get-end-shipping-service-order-${req.user.store._id}`, startShippingServiceOrdersResponse);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.endShippingServiceOrders = async (req, res) => {
  try {
    const { timeStamp, userConfirm } = req.body;
    const date = new Date(Date.now());
    const shipEnd =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);

    const findUnfinishedShippingServiceOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], "shipper.shipStart": undefined, "shippingService.timeStamp": timeStamp });
    if (findUnfinishedShippingServiceOrders.length > 0) {
      return res.json({ message: 'Chưa xử lý xong đơn hàng' });
    }

    const findPendingDeleteShippingServiceOrders = await Order.find({ status: "pending-delete-ship", "shippingService.timeStamp": timeStamp });
    if (findPendingDeleteShippingServiceOrders.length > 0) {
      return res.json({ message: 'Có đơn hàng đang chờ hủy' });
    }

    if (!userConfirm) {
      const findEndShippingServiceOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], "shipper.shipEnd": undefined, "shippingService.timeStamp": timeStamp });
      if (findEndShippingServiceOrders.length === 0) {
        return res.json({ message: 'Đơn hàng đã được người khác giao' });
      }

      // ---- SEND NOTIFICATION
      await notification.send(findEndShippingServiceOrders[0].store, req.user?.userId, constant.notification.common.title, `Đơn ${findEndShippingServiceOrders[0]?._id} đã được giao thành công.`, constant.notification.success.status);

      await Order.updateMany({ status: "ship", "shipper.shipEnd": undefined, "shippingService.timeStamp": timeStamp }, { status: "success", "shipper.shipEnd": shipEnd });
    } else {
      const findEndShippingServiceOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], "shipper.shipEnd": undefined, "shippingService.timeStamp": timeStamp });
      if (findEndShippingServiceOrders.length === 0) {
        return res.json({ message: 'Đơn hàng đã được người khác giao' });
      }

      // ---- SEND NOTIFICATION
      await notification.send(findEndShippingServiceOrders[0].store, req.user?.userId, constant.notification.common.title, `Đơn ${findEndShippingServiceOrders[0]?._id} đã được giao thành công.`, constant.notification.success.status);

      await Order.updateMany({ status: "ship", "shipper.shipEnd": undefined, "shippingService.timeStamp": timeStamp, }, { status: "success", "shipper.shipEnd": shipEnd, "confirmShip.user": new Types.ObjectId(userConfirm) });
    }

    const shippingServiceOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: req.user.store, shippingService: { $nin: [undefined] } })
      .populate({
        path: "shipper",
        populate: "user",
      }).populate({ path: "shippingService", populate: "user" });

    const timeStampSet = new Set(shippingServiceOrders.map(order => order.shippingService.timeStamp));
    const timeStampArray = Array.from(timeStampSet);

    const shippingServiceOrdersResponse = []
    timeStampArray.forEach(timeStamp => {
      const order = shippingServiceOrders.filter(order => order.shippingService.timeStamp === timeStamp);
      shippingServiceOrdersResponse.push({ order, timeStamp });
    })
    io.getIO().emit(`get-end-shipping-service-order-${req.user.store._id}`, shippingServiceOrdersResponse);
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.postStartShipOrder = async (data) => {
  const { shipId, orderId, store } = data;
  try {
    const order = await Order.findById(orderId);
    if (order.shipper.user !== undefined || order.status === "pending-delete-produce") {
      return;
    }
    const user = await User.findById(shipId);
    const date = new Date(Date.now());
    const shipStart =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);
    order.shipper = { user, shipStart };
    order.status = "ship";
    await order.save();

    // ---- SEND NOTIFICATION

    //----SOCKET ĐƠN HÀNG ĐANG GIAO
    const shipOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: new Types.ObjectId(store) }).lean().populate({
      path: "shipper",
      populate: "user",
    }).populate({
      path: "confirmShip",
      populate: "user",
    });
    const pendingShipOrders = shipOrders.filter(order => order.shipper.shipEnd === undefined);
    io.getIO().emit(`ship-order-quantity-${store}`, pendingShipOrders.length);
    const shipOrdersWeight = pendingShipOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`ship-order-weight-${store}`, shipOrdersWeight);

    const produceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: new Types.ObjectId(store) }).lean();
    io.getIO().emit(`produce-order-quantity-${store}`, produceOrders.length);
    const produceOrdersWeight = produceOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`produce-order-weight-${store}`, produceOrdersWeight);

    io.getIO().emit(`get-start-ship-order-${store}`, order);
    io.getIO().emit(`get-new-start-ship-order-${store}`, shipOrders);
    await notification.send(store, shipId, constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} đang giao hàng.`, constant.notification.ship.status);

    // const orderInfo = await Order.findById(orderId);
    // backupEmailData(store, `Nhận giao đơn hàng ${orderInfo.shiftDay}`,
    //   `<p><b>Ca:</b> ${orderInfo.shiftCode}${orderInfo.shiftIndex}-${orderInfo.shiftDay}</p>
    // <p><b>Người nhận giao:</b> ${user.name}</p>
    // <p><b>Thời gian:</b> ${shipStart}</p>
    // <p><b>Số lượng:</b> ${orderInfo.quantity}kg</p>
    // <p><b>Tiền:</b> ${orderInfo.totalPrice.toLocaleString()}đ</p>
    // <p><b>Thông tin:</b> ${orderInfo.detail}</p>
    // <p><b>Hình ảnh:</b> ${orderInfo.photoAttach.map((photo) => `${photo}, `)}</p>
    // <p><b>Dữ liệu:</b></p>
    // ${JSON.stringify(orderInfo)}`
    // );
  } catch (err) {
    console.log(err);
  }
};

exports.postEndShipOrder = async (data) => {
  const { orderId, store, userConfirm } = data;
  try {
    const order = await Order.findById(orderId).populate({
      path: "shipper",
      populate: "user",
    }).populate({
      path: "confirmShip",
      populate: "user",
    });
    if (order.status === "pending-delete-ship") {
      return;
    }
    const date = new Date(Date.now());
    const shipEnd =
      transformLocalDateString(date) +
      " - " +
      transformLocalTimeString(date);
    order.shipper = { ...order.shipper, shipEnd, timeStamp: new Date(`${shipEnd?.slice(0, 8)}, ${shipEnd?.slice(11, 19)}`).getTime() };
    order.status = "success";
    if (userConfirm) {
      order.confirmShip = { user: new Types.ObjectId(userConfirm) };
    }
    await order.save();

    // ---- SEND NOTIFICATION
    await notification.send(store, userConfirm ? userConfirm : String(order.shipper.user._id), constant.notification.common.title, `Đơn ${order.shiftCode}${order.shiftIndex} giao thành công.`, constant.notification.success.status);

    const shipOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: new Types.ObjectId(store) }).lean();
    const pendingShipOrders = shipOrders.filter(order => order.shipper.shipEnd === undefined);
    io.getIO().emit(`ship-order-quantity-${store}`, pendingShipOrders.length);

    const shipOrdersWeight = pendingShipOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);
    io.getIO().emit(`ship-order-weight-${store}`, shipOrdersWeight);

    const today = transformLocalDateString(date);
    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ $or: [{ status: "pending-produce-quick" }, { status: "pending-delete-success" }, { status: "success" }], store, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ $or: [{ status: "pending-produce-quick" }, { status: "pending-delete-success" }, { status: "success" }], store, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    } else {
      todaySuccessOrders = await Order.find({ $or: [{ status: "pending-produce-quick" }, { status: "pending-delete-success" }, { status: "success" }], store, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    }

    io.getIO().emit(`success-order-quantity-${store}`, todaySuccessOrders.length);

    const successOrdersWeight = todaySuccessOrders.reduce((total, order) => total += order.quantity, 0);

    io.getIO().emit(`success-order-weight-${store}`, (successOrdersWeight).toFixed(1));

    io.getIO().emit(`get-end-ship-order-${store}`, order);
    io.getIO().emit(`get-success-order-${store}`, todaySuccessOrders);
    const orderInfo = await Order.findById(orderId);
    const user = await User.findById(orderInfo.producer.user);
    const userConfirmInfo = await User.findById(orderInfo.confirmShip?.user);
    if (userConfirmInfo) {
      backupEmailData(store, `Đơn hàng thành công ${orderInfo.shiftDay}`,
        `<p><b>Ca:</b> ${orderInfo.shiftCode}${orderInfo.shiftIndex}-${orderInfo.shiftDay}</p>
    <p><b>Người xác nhận:</b> ${userConfirmInfo?.name}</p>
    <p><b>Thời gian:</b> ${shipEnd}</p>
    <p><b>Số lượng:</b> ${orderInfo.quantity}kg</p>
    <p><b>Tiền:</b> ${orderInfo.totalPrice.toLocaleString()}đ</p>
    <p><b>Thông tin:</b> ${orderInfo.detail}</p>
    <p><b>Hình ảnh:</b> ${orderInfo.photoAttach.map((photo) => `${photo}, `)}</p>
    <p><b>Dữ liệu:</b></p>
    ${JSON.stringify(orderInfo)}`
      );
    } else {
      backupEmailData(store, `Đơn hàng thành công ${orderInfo.shiftDay}`,
        `<p><b>Ca:</b> ${orderInfo.shiftCode}${orderInfo.shiftIndex}-${orderInfo.shiftDay}</p>
    <p><b>Người hoàn thành giao:</b> ${user.name}</p>
    <p><b>Thời gian:</b> ${shipEnd}</p>
    <p><b>Số lượng:</b> ${orderInfo.quantity}kg</p>
    <p><b>Tiền:</b> ${orderInfo.totalPrice.toLocaleString()}đ</p>
    <p><b>Thông tin:</b> ${orderInfo.detail}</p>
    <p><b>Hình ảnh:</b> ${orderInfo.photoAttach.map((photo) => `${photo}, `)}</p>
    <p><b>Dữ liệu:</b></p>
    ${JSON.stringify(orderInfo)}`
      );
    }

  } catch (err) {
    console.log(err);
  }
};

