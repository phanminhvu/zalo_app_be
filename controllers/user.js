const User = require('../models/user');
const bcrypt = require("bcryptjs");
const Role = require("../models/role");
const Order = require("../models/order");
const Order2023 = require("../models/2023order");
const TimerOrder = require("../models/timerOrder");
const { getStatisticsTime, transformLocalDateString, checkShiftTime, checkShiftTimeTimerOrder } = require("../utils/getTime");
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const { domain } = require("../utils/constant");
const { postCreateOrderScheduleUpdate } = require('./order');
const { generatePassword } = require('./admin-director/admin-director');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'quequansystem@gmail.com',
    pass: process.env.NODEMAILER_PASSWORD
  }
});

exports.getNotes = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await User.findById(userId);
    return res.status(200).json(user.notes);
  } catch (err) {
    console.log(err);
  }
}

exports.postNote = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await User.findById(userId);
    user.notes.push(req.body);
    await user.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getPersonalStatistics = async (req, res) => {
  const { shift, date, month, year } = req.query;
  const userId = req.user.userId;
  let quickPurchaseOrders;
  let transferOrders = [];
  let appOrders = [];
  try {

    let ordersCreateFilter;
    if (year === "2023") {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

        } else if (date === "" && month !== "") {
          ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2), quickPurchase: true }).lean().count();
        } else if (date === "" && month === "") {
          ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2), quickPurchase: true }).lean().count();
        }
      } else {
        if (date !== "" && month !== "") {
          ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

        } else if (date === "" && month !== "") {
          ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2), quickPurchase: true }).lean().count();
        } else if (date === "" && month === "") {
          ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2), quickPurchase: true }).lean().count();
        }
      }
    } else {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

        } else if (date === "" && month !== "") {
          ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2), quickPurchase: true }).lean().count();
        } else if (date === "" && month === "") {
          ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2), quickPurchase: true }).lean().count();
        }
      } else {
        if (date !== "" && month !== "") {
          ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

        } else if (date === "" && month !== "") {
          ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, month, year: year.slice(-2), quickPurchase: true }).lean().count();
        } else if (date === "" && month === "") {
          ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2) }).lean();
          quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": userId, year: year.slice(-2), quickPurchase: true }).lean().count();
        }
      }
    }

    let ordersProduceFilter = []
    if (year === "2023") {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, year: year.slice(-2) }).lean();
        }

      } else {
        if (date !== "" && month !== "") {
          ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, date, month, year: year.slice(-2) }).lean();

        } else if (date === "" && month !== "") {
          ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, month, year: year.slice(-2) }).lean();

        } else if (date === "" && month === "") {
          ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, year: year.slice(-2) }).lean();
        }
      }
    } else {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, year: year.slice(-2) }).lean();
        }

      } else {
        if (date !== "" && month !== "") {
          ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, date, month, year: year.slice(-2) }).lean();

        } else if (date === "" && month !== "") {
          ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, month, year: year.slice(-2) }).lean();

        } else if (date === "" && month === "") {
          ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": userId, year: year.slice(-2) }).lean();
        }
      }
    }

    let ordersShipFilter = [];
    if (year === "2023") {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2) }).lean();
          transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month !== "") {
          ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2) }).lean();
          transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month === "") {
          ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2) }).lean();
          transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), app: true }).lean();
        }

      } else {
        if (date !== "" && month !== "") {
          ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2) }).lean();
          transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month !== "") {
          ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2) }).lean();
          transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month === "") {
          ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2) }).lean();
          transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), app: true }).lean();
        }
      }
    } else {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2) }).lean();
          transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month !== "") {
          ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2) }).lean();
          transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month === "") {
          ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2) }).lean();
          transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), app: true }).lean();
        }

      } else {
        if (date !== "" && month !== "") {
          ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2) }).lean();
          transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], date, month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month !== "") {
          ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2) }).lean();
          transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], month, year: year.slice(-2), app: true }).lean();

        } else if (date === "" && month === "") {
          ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2) }).lean();
          transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), payment: 'transfer' }).lean();
          appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": userId }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: userId } }, { "confirmShip.user": userId }] }], year: year.slice(-2), app: true }).lean();
        }
      }
    }


    const quantity = ordersShipFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const revenue = ordersShipFilter.reduce((sum, order) => sum += order.totalPrice, 0);

    const transferOrdersRevenue = transferOrders.reduce((sum, order) => sum += order.totalPrice, 0);
    const appOrdersRevenue = appOrders.reduce((sum, order) => sum += order.totalPrice, 0);
    return res.json({ ordersCreate: ordersCreateFilter, ordersProduce: ordersProduceFilter, ordersShip: ordersShipFilter, revenue, quantity, quickPurchaseOrders, transferOrders: transferOrders.length, transferOrdersRevenue, appOrders: appOrders.length, appOrdersRevenue });
  } catch (err) {
    console.log(err);
  }
}

exports.getUserStatisticsByStore = async (req, res) => {
  const { shift, date, month, year } = req.query;
  const store = req.user.store;

  try {
    const usersByStore = await User.find({ store }).lean().populate('role');
    const userArray = usersByStore.map((user) => ({ name: user.name, id: user._id, role: user.role?.description }));
    const userStatistics = await Promise.all(userArray.map(async (user) => {
      let quickPurchaseOrders;
      let transferOrders = [];
      let appOrders = [];

      let ordersCreateFilter;
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        } else {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        } else {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean().count();
            quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        }
      }

      let ordersProduceFilter = []
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean().count();
          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean().count();
          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean().count();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean().count();

          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean().count();

          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean().count();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean().count();
          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean().count();
          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean().count();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean().count();

          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean().count();

          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean().count();
          }
        }
      }

      let ordersShipFilter = [];
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), app: true }).lean();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), app: true }).lean();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), app: true }).lean();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], $or: [{ $and: [{ "shipper.user": user.id }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user.id } }, { "confirmShip.user": user.id }] }], year: year.slice(-2), app: true }).lean();
          }
        }
      }

      const quantity = ordersShipFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
      const revenue = ordersShipFilter.reduce((sum, order) => sum += order.totalPrice, 0);

      const transferOrdersRevenue = transferOrders.reduce((sum, order) => sum += order.totalPrice, 0);
      const appOrdersRevenue = appOrders.reduce((sum, order) => sum += order.totalPrice, 0);

      return { name: user.name, role: user.role, ordersCreate: ordersCreateFilter, ordersProduce: ordersProduceFilter, ordersShip: ordersShipFilter.length, revenue, quantity, quickPurchaseOrders, transferOrders: transferOrders.length, transferOrdersRevenue, appOrders: appOrders.length, appOrdersRevenue }
    }))

    return res.json(userStatistics);
  } catch (err) {
    console.log(err);
  }
}

exports.deleteNote = async (req, res) => {
  const { noteId } = req.body;
  const { userId } = req.user;
  try {
    const user = await User.findById(userId);
    const updateNotes = user.notes.filter(note => note._id.toString() !== noteId);
    user.notes = updateNotes;
    await user.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    return res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.postEditUser = async (req, res, next) => {
  const { id, name, photo } = req.body;
  try {
    const userEdit = await User.findById(id).populate('role').populate('store');
    const role = await Role.findById(userEdit.role);
    userEdit.name = name;
    userEdit.photo = photo;
    await userEdit.save();
    res.status(200).json({
      message: 'Cập nhật thông tin thành công!', userEdit: {
        id: userEdit._id,
        name: userEdit.name,
        email: userEdit.email,
        store: userEdit.store?._id,
        storeName: userEdit.store?.name,
        photo: userEdit.photo,
        role: userEdit.role.name,
        roleDescription: role.description,
        permission: userEdit.role.permission
      },
    })
  } catch (err) {
    console.log(err);
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { email } = req.user;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'Không tìm thấy người dùng' });
    }
    const doMatchPassword = await bcrypt.compare(oldPassword, user.password);
    if (!doMatchPassword) {
      return res.json({ message: 'Mật khẩu cũ không chính xác!' })
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    user.save();
    return res.json({ message: 'Đổi mật khẩu mới thành công!' })
  } catch (err) {
    console.log(err);
  }
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Email này chưa được đăng ký!" })
    }
    const resetPassword = generatePassword(8);
    const hashedNewPassword = await bcrypt.hash(resetPassword, 12);
    user.resetPassword = hashedNewPassword;
    await user.save();
    transporter.sendMail({
      to: email,
      from: "admin@admin.com",
      subject: "Khôi phục mật khẩu ứng dụng quản lý bán hàng",
      html: `<h1>Tài khoản của bạn:</h1>
      <h5>Tên đăng nhập: ${email}</h5>
      <h5>Mật khẩu khôi phục: ${resetPassword}</h5>
      `
    }, (err, result) => {
      console.log(err)
    })
    return res.status(200).json({ message: 'Mật khẩu mới đã được gửi vào email của bạn' })
  } catch (err) {
    console.log(err);
  }
}

exports.getTimerOrdersByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const timerOrders = await TimerOrder.find({ 'createOrderData.store': storeId, status: 'pending' }).lean();
    return res.json(timerOrders);
  } catch (err) {
    console.log(err);
  }
}

exports.getNearestTimerOrdersByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const shiftDay = checkShiftTime().shiftDay;
    const oneDayBefore = new Date(shiftDay);
    const twoDaysBefore = new Date(shiftDay);
    const threeDaysBefore = new Date(shiftDay);
    if (checkShiftTime().morningShift === true) {
      oneDayBefore.setDate(oneDayBefore.getDate() + 0);
      twoDaysBefore.setDate(twoDaysBefore.getDate() + 1);
      threeDaysBefore.setDate(threeDaysBefore.getDate() + 2);
    } else {
      oneDayBefore.setDate(oneDayBefore.getDate() + 1);
      twoDaysBefore.setDate(twoDaysBefore.getDate() + 2);
      threeDaysBefore.setDate(threeDaysBefore.getDate() + 3);
    }
    const dayOne = getStatisticsTime(oneDayBefore);
    const dayTwo = getStatisticsTime(twoDaysBefore);
    const dayThree = getStatisticsTime(threeDaysBefore);
    const dayOneTimerOrdersMorning = await TimerOrder.find({ shiftCode: 'S', 'createOrderData.store': storeId, "shiftDay.date": dayOne.date, "shiftDay.month": dayOne.month, "shiftDay.year": dayOne.year }).lean();
    const dayOneTimerOrdersMorningWeight = dayOneTimerOrdersMorning.reduce((total, order) => total += Number(order.createOrderData.quantity), 0).toFixed(1);

    const dayTwoTimerOrdersMorning = await TimerOrder.find({ shiftCode: 'S', 'createOrderData.store': storeId, "shiftDay.date": dayTwo.date, "shiftDay.month": dayTwo.month, "shiftDay.year": dayTwo.year }).lean();
    const dayTwoTimerOrdersMorningWeight = dayTwoTimerOrdersMorning.reduce((total, order) => total += Number(order.createOrderData.quantity), 0).toFixed(1);

    const dayThreeTimerOrdersMorning = await TimerOrder.find({ shiftCode: 'S', 'createOrderData.store': storeId, "shiftDay.date": dayThree.date, "shiftDay.month": dayThree.month, "shiftDay.year": dayThree.year }).lean();
    const dayThreeTimerOrdersMorningWeight = dayThreeTimerOrdersMorning.reduce((total, order) => total += Number(order.createOrderData.quantity), 0).toFixed(1);


    const dayOneTimerOrdersAfternoon = await TimerOrder.find({ shiftCode: 'C', 'createOrderData.store': storeId, "shiftDay.date": dayOne.date, "shiftDay.month": dayOne.month, "shiftDay.year": dayOne.year }).lean();
    const dayOneTimerOrdersAfternoonWeight = dayOneTimerOrdersAfternoon.reduce((total, order) => total += Number(order.createOrderData.quantity), 0).toFixed(1);

    const dayTwoTimerOrdersAfternoon = await TimerOrder.find({ shiftCode: 'C', 'createOrderData.store': storeId, "shiftDay.date": dayTwo.date, "shiftDay.month": dayTwo.month, "shiftDay.year": dayTwo.year }).lean();
    const dayTwoTimerOrdersAfternoonWeight = dayTwoTimerOrdersAfternoon.reduce((total, order) => total += Number(order.createOrderData.quantity), 0).toFixed(1);

    const dayThreeTimerOrdersAfternoon = await TimerOrder.find({ shiftCode: 'C', 'createOrderData.store': storeId, "shiftDay.date": dayThree.date, "shiftDay.month": dayThree.month, "shiftDay.year": dayThree.year }).lean();
    const dayThreeTimerOrdersAfternoonWeight = dayThreeTimerOrdersAfternoon.reduce((total, order) => total += Number(order.createOrderData.quantity), 0).toFixed(1);

    return res.json({
      dayOne: { date: transformLocalDateString(oneDayBefore), quantity: { morning: dayOneTimerOrdersMorning.length, afternoon: dayOneTimerOrdersAfternoon.length }, weight: { morning: dayOneTimerOrdersMorningWeight, afternoon: dayOneTimerOrdersAfternoonWeight } },
      dayTwo: { date: transformLocalDateString(twoDaysBefore), quantity: { morning: dayTwoTimerOrdersMorning.length, afternoon: dayTwoTimerOrdersAfternoon.length }, weight: { morning: dayTwoTimerOrdersMorningWeight, afternoon: dayTwoTimerOrdersAfternoonWeight } },
      dayThree: { date: transformLocalDateString(threeDaysBefore), quantity: { morning: dayThreeTimerOrdersMorning.length, afternoon: dayThreeTimerOrdersAfternoon.length }, weight: { morning: dayThreeTimerOrdersMorningWeight, afternoon: dayThreeTimerOrdersAfternoonWeight } },
    }
    );
  } catch (err) {
    console.log(err);
  }
}

const startCreateTimerOrder = async (order) => {
  const { hours, minutes, second, date, month, year } = order.timer;
  try {
    const rule = new schedule.RecurrenceRule();
    rule.second = second;
    rule.minute = minutes;
    rule.hour = hours;
    rule.date = date;
    rule.month = month - 1;
    rule.year = year;
    rule.tz = "Asia/Saigon"
    schedule.scheduleJob(order.jobName, rule, async function () {
      postCreateOrderScheduleUpdate(order.createOrderData);
      await TimerOrder.findByIdAndUpdate(order._id, { status: 'approved' });
      const currentJob = schedule.scheduledJobs[order.jobName];
      currentJob?.cancel();
    });
  } catch (err) {
    console.log(err);
  }
}

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

exports.updateTimerOrder = async (req, res) => {
  const data = JSON.parse(req.body.data);
  const { id, createOrderData, timer } = data;
  try {
    const imageUrl = []
    if (req.file) {
      const formatPath = domain + req.file.path.replace("\\", "/");
      imageUrl.push(formatPath);
    }
    const deleteOrder = await TimerOrder.findById(id);
    let currentJob = schedule.scheduledJobs[deleteOrder.jobName];
    currentJob?.cancel();
    await TimerOrder.findByIdAndDelete(id);
    const phone = extractPhone(createOrderData.detail);
    const checkShift = checkShiftTimeTimerOrder(timer.hours, timer.minutes, timer.date, timer.month, timer.year);
    const timerOrder = new TimerOrder(
      {
        status: 'pending',
        createOrderData: { ...createOrderData, photoAttach: imageUrl },
        phone,
        timer,
        jobName: new Date().getTime(),
        shiftCode: checkShift.morningShift ? 'S' : 'C',
        shiftDay: { date: checkShift.shiftDay.date, month: checkShift.shiftDay.month, year: checkShift.shiftDay.year }
      }
    );
    await timerOrder.save()
    startCreateTimerOrder(timerOrder);
    return res.status(200).json({ message: 'Cập nhật thành công!' });
  } catch (err) {
    console.log(err);
  }
}

exports.deleteTimerOrder = async (req, res) => {
  const { orderId } = req.body;
  try {
    const deleteOrder = await TimerOrder.findById(orderId);
    if (req.user.role === "admin" || req.user.role === "director" || req.user.role === "assistant") {
      let currentJob = schedule.scheduledJobs[deleteOrder.jobName];
      currentJob?.cancel();
      await TimerOrder.findByIdAndDelete(orderId);
      return res.json({ message: 'Hủy đơn thành công!' })
    } else {
      if (req.user.userId !== deleteOrder.createOrderData.creator.id) {
        return res.json({ message: 'Bạn không thể hủy đơn của người khác!' })
      } else {
        let currentJob = schedule.scheduledJobs[deleteOrder.jobName];
        currentJob?.cancel();
        await TimerOrder.findByIdAndDelete(orderId);
        return res.json({ message: 'Hủy đơn thành công!' })
      }
    }
  } catch (err) {
    console.log(err);
  }
}
