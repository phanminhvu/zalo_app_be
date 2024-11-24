require("dotenv").config();
const User = require("../../models/user");
const { Types } = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Role = require('../../models/role');
const SubStock = require('../../models/subStock');
const Store = require('../../models/store');
const Order = require('../../models/order');
const Order2023 = require("../../models/2023order");
const Tag = require('../../models/tag');
const DeletedOrder = require("../../models/deletedOrder");
const UpdatedOrder = require("../../models/updatedOrder");
const GuestOrder = require('../../models/guestOrder');
const io = require("../../socket");

const { getStatisticsTime, transformLocalDateString } = require("../../utils/getTime")
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'quequansystem@gmail.com',
    pass: process.env.NODEMAILER_PASSWORD
  }
});

exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('role').populate('store');
    return res.json({ id: user._id, email: user.email, name: user.name, role: user.role, store: user.store });
  } catch (err) {
    console.log(err);
  }
}

exports.generatePassword = (passwordLength) => {
  const numberChars = "0123456789";
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const specialChars = "!@#$%()";
  const allChars = numberChars + upperChars + lowerChars + specialChars;
  let randPasswordArray = Array(passwordLength);
  randPasswordArray[0] = numberChars;
  randPasswordArray[1] = upperChars;
  randPasswordArray[2] = lowerChars;
  randPasswordArray[3] = specialChars;
  randPasswordArray = randPasswordArray.fill(allChars, 4);
  return shuffleArray(randPasswordArray.map(function (x) { return x[Math.floor(Math.random() * x.length)] })).join('');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}


exports.postSignupUser = async (req, res) => {
  const { email, name, roleId, storeId } = req.body;
  const errors = validationResult(req);
  const randomPassword = this.generatePassword(8);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }
  try {
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    const role = new Types.ObjectId(roleId);
    const roleData = await Role.findById(roleId);
    if (storeId !== "" && roleData.name !== 'director' && roleData.name !== 'assistant' && roleData.name !== 'admin') {
      const storeObjectId = new Types.ObjectId(storeId);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        store: storeObjectId,
        photo: "https://i.ibb.co/BffwmfT/user.png"
      });
      await user.save();
    } else {
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        photo: "https://i.ibb.co/BffwmfT/user.png"
      });
      await user.save();
    }
    transporter.sendMail({
      to: email,
      from: "admin@admin.com",
      subject: "Thông tin tài khoản ứng dụng quản lý bán hàng",
      html: `<h1>Tài khoản của bạn:</h1>
      <h4>Vị trí: ${roleData.description}</h4>
      <h5>Tên đăng nhập: ${email}</h5>
      <h5>Mật khẩu: ${randomPassword}</h5>
      `
    }, (err, result) => {
      console.log(err)
    })
    return res.status(200).json({ message: "Đăng ký thành công! Thông tin tài khoản đã được gửi vào email" });
  } catch (err) {
    console.log(err);
  }
}

exports.putEditUser = async (req, res) => {
  const { roleId, storeId } = (req.body);
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    const usersByStore = await User.find({ store: storeId });
    const findStoreManager = usersByStore.find(user => user.role?.toString() === "643cef74162c633b558c08d0");
    if (roleId !== "643cef74162c633b558c08d0" && roleId !== "643ce869e6c312b8c449e26f" && roleId !== "643cef2e162c633b558c08cd") {
      user.role = new Types.ObjectId(roleId);
      user.store = new Types.ObjectId(storeId);
      await user.save();
    } else if (roleId === "643cef74162c633b558c08d0" && roleId !== "643ce869e6c312b8c449e26f" && roleId !== "643cef2e162c633b558c08cd" && !findStoreManager) {
      user.role = new Types.ObjectId(roleId);
      user.store = new Types.ObjectId(storeId);
      await user.save();
    } else if (roleId === "643cef74162c633b558c08d0" && roleId !== "643ce869e6c312b8c449e26f" && roleId !== "643cef2e162c633b558c08cd" && findStoreManager) {
      return res.json({ message: 'Cửa hàng đã có cừa hàng trưởng khác, vui lòng thay đổi vị trí trước khi tiếp tục' })
    } else if (roleId === "643ce869e6c312b8c449e26f" || roleId === "643cef2e162c633b558c08cd") {
      user.role = new Types.ObjectId(roleId);
      user.store = undefined;
      await user.save();
    }
    return res.json({ message: 'Cập nhật người dùng thành công' })
  } catch (err) {
    console.log(err);
  }
}

exports.deleteUser = async (req, res) => {
  const { userId } = req.body;
  try {
    await User.findByIdAndDelete(userId);
    return res.json({ message: 'Xóa người dùng thành công' })

  } catch (err) {
    console.log(err);
  }
}

exports.getRoleById = async (req, res, next) => {
  const { roleId } = req.params;
  try {
    const roles = await Role.findById(roleId);
    return res.json(roles);
  } catch (err) {
    console.log(err);
  }
};

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find().lean();
    return res.json(stores)
  } catch (err) {
    console.log(err);
  }
}

exports.getStoreById = async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);
    return res.json(store);

  } catch (err) {
    console.log(err);
  }
}

exports.postSignupStore = async (req, res) => {
  const { name } = req.body;
  try {
    const newStore = new Store({ name });
    await newStore.save();
    const subStock = new SubStock({ maxCapacity: 300, lossRatio: 6, averageConsumption: 45, freshInventory: 0, cookedInventory: 0, store: new Types.ObjectId(newStore._id), updatedBy: req.user.userId });
    await subStock.save();
    return res.status(200).json({ message: "Đăng ký cửa hàng thành công!" })
  } catch (err) {
    console.log(err);
  }
}

exports.putEditStore = async (req, res) => {
  const { storeId } = req.params;
  const { name, bank, account_name, account_number, phone, display_transfer_info } = req.body;
  try {
    const store = await Store.findById(storeId);
    store.name = name;
    store.bank = bank;
    store.account_name = account_name;
    store.account_number = account_number;
    store.phone = phone;
    store.display_transfer_info = display_transfer_info;
    await store.save();
    return res.json({ message: 'Cập nhật cửa hàng thành công' })

  } catch (err) {
    console.log(err);
  }
}

exports.deleteStore = async (req, res) => {
  const { storeId } = req.body;
  try {
    await Store.findByIdAndDelete(storeId);
    return res.json({ message: 'Xóa cửa hàng thành công' })
  } catch (err) {
    console.log(err);
  }
}

exports.getStoreManagers = async (req, res) => {
  try {
    const storesManager = await User.find({ role: "643cef74162c633b558c08d0" }).lean().populate('role').populate('store');
    const storesManagerResponse = storesManager.map((user) => {
      return { id: user._id, email: user.email, name: user.name, role: user.role, store: user.store }
    })
    return res.json(storesManagerResponse);

  } catch (err) {
    console.log(err);
  }
}

exports.getOrdersByStore = async (req, res) => {
  const { storeId } = req.params;
  const date = new Date(Date.now());
  const today = transformLocalDateString(date);
  try {
    const allOrdersExceptSuccess = await Order.find({
      status: ["create", "pending-produce", "produce", "pending-delete-produce", "pending-delete-ship", "ship", "pending-produce-quick", "pending-delete-success"], store: storeId
    }).lean()
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
      });
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

}

exports.getCreateOrderByStore = async (req, res, next) => {
  const { storeId } = req.params;
  try {
    const createOrders = await Order.find({ $or: [{ status: "create" }, { status: "pending-produce" }], store: storeId }).sort({ _id: 1 }).lean().populate({
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

    return res.json(createOrders);

  } catch (err) {
    console.log(err);
  }
};

exports.getProduceOrderByStore = async (req, res, next) => {
  const { storeId } = req.params;
  try {
    const produceOrders = await Order.find({ $or: [{ status: "produce" }, { status: "pending-delete-produce" }], store: storeId, shipper: undefined }).sort({ _id: 1 }).lean().populate({
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

exports.getShipOrderByStore = async (req, res, next) => {
  const { storeId } = req.params;
  try {
    const shipOrders = await Order.find({ $or: [{ status: "ship" }, { status: "pending-delete-ship" }], store: storeId }).sort({ _id: 1 }).lean().populate({
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
    return res.json(shipOrders.filter(order => order.shipper.user));

  } catch (err) {
    console.log(err);
  }
};

exports.getSuccessOrderByStore = async (req, res, next) => {
  const { storeId } = req.params;
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
      todaySuccessOrders = await Order.find({ status: ["pending-produce-quick", "pending-delete-success", "success"], store: storeId, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-produce-quick", "pending-delete-success", "success"], store: storeId, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    } else {
      todaySuccessOrders = await Order.find({ status: ["pending-produce-quick", "pending-delete-success", "success"], store: storeId, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: 1 }).lean().populate({
        path: "shipper",
        populate: "user",
      }).populate({
        path: "confirmShip",
        populate: "user",
      });
    };
    return res.json(todaySuccessOrders);
  } catch (err) {
    console.log(err);
  }
};

const limitOrder = 1000;

exports.getOrdersQuantityByStore = async (req, res, next) => {
  const { storeId } = req.params;
  try {
    const createOrdersQuantity = await Order.find({ status: ["create", "pending-produce"], store: storeId }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    //ĐƠN HÀNG ĐANG XỬ LÝ
    const produceOrders = await Order.find({ status: ["produce", "pending-delete-produce"], store: storeId }).sort({ _id: -1 }).limit(limitOrder).lean();
    const produceOrdersQuantity = produceOrders.filter(order => order.producer.produceEnd === undefined);
    //ĐƠN HÀNG ĐANG GIAO
    const shipOrders = await Order.find({ status: ["ship", "pending-delete-ship"], store: storeId }).sort({ _id: -1 }).limit(limitOrder).lean();
    const shipOrdersQuantity = shipOrders.filter(order => order.shipper.shipEnd === undefined);
    const date = new Date(Date.now());
    const today = transformLocalDateString(date);

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: storeId, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: storeId, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    } else {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: storeId, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean().count();
    };


    return res.json({
      createOrdersQuantity,
      produceOrdersQuantity: produceOrdersQuantity.length,
      shipOrdersQuantity: shipOrdersQuantity.length,
      successOrdersQuantity: todaySuccessOrders,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getOrdersWeightByStore = async (req, res, next) => {
  const { storeId } = req.params;
  const date = new Date(Date.now());
  const today = transformLocalDateString(date);
  try {
    const createOrders = await Order.find({ status: ["create", "pending-produce"], store: storeId }).sort({ _id: -1 }).limit(limitOrder).lean();
    const createOrdersWeight = createOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);

    const produceOrders = await Order.find({ status: ["produce", "pending-delete-produce"], store: storeId }).sort({ _id: -1 }).limit(limitOrder).lean();
    const completeProduceOrders = produceOrders.filter(order => order.producer.produceEnd !== undefined);
    const produceOrdersWeight = completeProduceOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);

    const shipOrders = await Order.find({ status: ["ship", "pending-delete-ship"], store: storeId }).sort({ _id: -1 }).limit(limitOrder).lean();
    const pendingShipOrders = shipOrders.filter(order => order.shipper.shipEnd === undefined);
    const shipOrdersWeight = pendingShipOrders.reduce((total, order) => total += order.quantity, 0).toFixed(1);

    const startMorningToday = new Date(`${today}, 09:00 PM`).getTime() - 86400000;
    const endMorningToday = new Date(`${today}, 01:30 PM`).getTime();
    const endAfternoonToday = new Date(`${today}, 09:00 PM`).getTime();
    const endMorningNextDay = new Date(`${today}, 01:30 PM`).getTime() + 86400000;
    const now = new Date().getTime();

    let todaySuccessOrders;
    if (now <= endMorningToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: storeId, "shipper.timeStamp": { $gte: startMorningToday, $lt: endMorningToday } }).sort({ _id: -1 }).limit(limitOrder).lean();
    }
    else if (now > endMorningToday && now <= endAfternoonToday) {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: storeId, "shipper.timeStamp": { $gte: endMorningToday, $lt: endAfternoonToday } }).sort({ _id: -1 }).limit(limitOrder).lean();
    } else {
      todaySuccessOrders = await Order.find({ status: ["pending-delete-success", "pending-produce-quick", "success"], store: storeId, "shipper.timeStamp": { $gte: endAfternoonToday, $lt: endMorningNextDay } }).sort({ _id: -1 }).limit(limitOrder).lean();
    };
    const todaySuccessOrdersWeight = todaySuccessOrders.reduce((total, order) => total += order.quantity, 0)


    return res.json({ createOrdersWeight, produceOrdersWeight, shipOrdersWeight, todaySuccessOrdersWeight: (todaySuccessOrdersWeight).toFixed(1) })
  } catch (err) {
    console.log(err);
  }
}

exports.getTagsByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const tags = await Tag.find({ store: storeId }).lean().sort({ index: 1 });
    return res.json(tags);

  } catch (err) {
    console.log(err);
  }
}

exports.postTag = async (req, res) => {
  const { name, store, color } = req.body;
  const indexN = await Tag.count();
  try {
    const checkTagName = await Tag.findOne({ name, store });
    if (checkTagName) {
      return res.json({ message: 'Tag có nội dung đã tồn tại' });
    }
    const tag = new Tag({
      name: name,
      store: new Types.ObjectId(store),
      color: color,
      index: indexN,
      status: true
    })
    await tag.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.deleteTag = async (req, res) => {
  const { tagId } = req.body;
  try {
    await Tag.findByIdAndDelete(tagId);
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.updateTag = async (req, res) => {
  const { storeId, tags } = req.body;
  try {
    for (i = 0; i < tags.length; i++) {
      await Tag.updateOne({ _id: tags[i]._id, store: storeId }, {
        $set: {
          name: tags[i].name,
          store: tags[i].store,
          color: tags[i].color,
          status: tags[i].status,
          index: tags[i].index
        }
      })
    }
    return res.end();
  } catch (err) {
    console.log(err);
  }
}


const getSumStatistics = async () => {
  try {
    const orders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }] }).lean();
    const totalQuantity = orders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenue = orders.reduce((sum, order) => sum += order.totalPrice, 0).toFixed(1);
    return ({ totalQuantity, totalRevenue });

  } catch (err) {
    console.log(err);
  }
}

exports.getStatisticsAllStore = async (req, res) => {
  const { shift, date, month, year } = req.query;
  try {
    const total = await getSumStatistics();
    const allStores = await Store.find();
    const statisticsList = await Promise.all(allStores.map(async (_store) => {
      const store = await Store.findById(_store._id);
      let ordersByStoreFilter;
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month !== "") {
            ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month === "") {
            ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: year.slice(-2) }).lean();
          }
        } else {
          if (date !== "" && month !== "") {
            ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month !== "") {
            ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month === "") {
            ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: year.slice(-2) }).lean();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month !== "") {
            ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month === "") {
            ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: year.slice(-2) }).lean();
          }
        } else {
          if (date !== "" && month !== "") {
            ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month !== "") {
            ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month === "") {
            ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: year.slice(-2) }).lean();
          }
        }
      }

      const totalOrdered = ordersByStoreFilter.length;
      const totalQuantity = ordersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
      const totalRevenue = ordersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);
      const totalQuantityPercentage = (+totalQuantity / +total.totalQuantity * 100).toFixed(1);
      const totalRevenuePercentage = (+totalRevenue / +total.totalRevenue * 100).toFixed(1);
      return { storeName: store.name, statistics: { totalOrdered, totalQuantity, totalRevenue }, percentage: { totalQuantityPercentage, totalRevenuePercentage } }
    }));
    return res.json(statisticsList);
  } catch (err) {
    console.log(err);
  }
}

exports.postStatisticsCompareAllStore = async (req, res) => {
  const { firstTimePick, secondTimePick } = req.body;
  try {
    const allStores = await Store.find();
    const statisticsList = await Promise.all(allStores.map(async (_store) => {
      const store = await Store.findById(_store._id);
      let firstOrdersByStoreFilter;
      if (firstTimePick.year === "2023") {
        if (firstTimePick.date !== "" && firstTimePick.month !== "") {
          firstOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date: firstTimePick.date, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

        } else if (firstTimePick.date === "" && firstTimePick.month !== "") {
          firstOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

        } else if (firstTimePick.date === "" && firstTimePick.month === "") {
          firstOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: firstTimePick.year.slice(-2) }).lean();
        }
      } else {
        if (firstTimePick.date !== "" && firstTimePick.month !== "") {
          firstOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date: firstTimePick.date, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

        } else if (firstTimePick.date === "" && firstTimePick.month !== "") {
          firstOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

        } else if (firstTimePick.date === "" && firstTimePick.month === "") {
          firstOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: firstTimePick.year.slice(-2) }).lean();
        }
      }
      const firstTotalQuantity = firstOrdersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
      const firstTotalRevenue = firstOrdersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);

      //-----SECOND TIME-----
      let secondOrdersByStoreFilter;
      if (secondTimePick.year === "2023") {
        if (secondTimePick.date !== "" && secondTimePick.month !== "") {
          secondOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date: secondTimePick.date, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
        } else if (secondTimePick.date === "" && secondTimePick.month !== "") {
          secondOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
        } else if (secondTimePick.date === "" && secondTimePick.month === "") {
          secondOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: secondTimePick.year.slice(-2) }).lean();
        }
      } else {
        if (secondTimePick.date !== "" && secondTimePick.month !== "") {
          secondOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, date: secondTimePick.date, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
        } else if (secondTimePick.date === "" && secondTimePick.month !== "") {
          secondOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
        } else if (secondTimePick.date === "" && secondTimePick.month === "") {
          secondOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: _store._id, year: secondTimePick.year.slice(-2) }).lean();
        }
      }

      const secondTotalQuantity = secondOrdersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
      const secondTotalRevenue = secondOrdersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);
      return { storeName: store.name, firstStatistics: { firstTotalQuantity, firstTotalRevenue }, secondStatistics: { secondTotalQuantity, secondTotalRevenue } }
    }));
    return res.json(statisticsList);
  } catch (err) {
    console.log(err);
  }
}

exports.getStatisticsByStore = async (req, res) => {
  const { shift, date, month, year } = req.query;
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);

    let ordersByStoreFilter;
    if (year === "2023") {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: year.slice(-2) }).lean();
        }
      } else {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: year.slice(-2) }).lean();
        }
      }
    } else {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: year.slice(-2) }).lean();
        }
      } else {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: year.slice(-2) }).lean();
        }
      }
    }

    const totalOrdered = ordersByStoreFilter.length;
    const totalQuantity = ordersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenue = ordersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);

    const cashOrders = ordersByStoreFilter.filter(order => order.payment === "cash");
    const totalQuantityCashOrders = cashOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenueCashOrders = cashOrders.reduce((sum, order) => sum += order.totalPrice, 0);

    const appOrders = ordersByStoreFilter.filter(order => order.payment === "cash" && order.app);
    const totalQuantityAppOrders = appOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenueAppOrders = appOrders.reduce((sum, order) => sum += order.totalPrice, 0);

    const transferOrders = ordersByStoreFilter.filter(order => order.payment === "transfer");
    const totalQuantityTransferOrders = transferOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenueTransferOrders = transferOrders.reduce((sum, order) => sum += order.totalPrice, 0);

    return res.json({ storeName: store.name, statistics: { totalOrdered, totalQuantity, totalRevenue }, cashOrders: { totalOrdered: cashOrders.length, totalQuantity: totalQuantityCashOrders, totalRevenue: totalRevenueCashOrders }, transferOrders: { totalOrdered: transferOrders.length, totalQuantity: totalQuantityTransferOrders, totalRevenue: totalRevenueTransferOrders }, appOrders: { totalOrdered: appOrders.length, totalQuantity: totalQuantityAppOrders, totalRevenue: totalRevenueAppOrders } });
  } catch (err) {
    console.log(err);
  }
}

exports.postStatisticsCompareByStore = async (req, res) => {
  const { firstTimePick, secondTimePick } = req.body;
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);

    let firstOrdersByStoreFilter;
    if (firstTimePick.year === "2023") {
      if (firstTimePick.date !== "" && firstTimePick.month !== "") {
        firstOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date: firstTimePick.date, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

      } else if (firstTimePick.date === "" && firstTimePick.month !== "") {
        firstOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

      } else if (firstTimePick.date === "" && firstTimePick.month === "") {
        firstOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: firstTimePick.year.slice(-2) }).lean();
      }
    } else {
      if (firstTimePick.date !== "" && firstTimePick.month !== "") {
        firstOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date: firstTimePick.date, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

      } else if (firstTimePick.date === "" && firstTimePick.month !== "") {
        firstOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month: firstTimePick.month, year: firstTimePick.year.slice(-2) }).lean();

      } else if (firstTimePick.date === "" && firstTimePick.month === "") {
        firstOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: firstTimePick.year.slice(-2) }).lean();
      }
    }
    const firstTotalOrdered = firstOrdersByStoreFilter.length;
    const firstTotalQuantity = firstOrdersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const firstTotalRevenue = firstOrdersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);

    //-----SECOND TIME-----
    let secondOrdersByStoreFilter;
    if (secondTimePick.year === "2023") {
      if (secondTimePick.date !== "" && secondTimePick.month !== "") {
        secondOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date: secondTimePick.date, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
      } else if (secondTimePick.date === "" && secondTimePick.month !== "") {
        secondOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
      } else if (secondTimePick.date === "" && secondTimePick.month === "") {
        secondOrdersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: secondTimePick.year.slice(-2) }).lean();
      }
    } else {
      if (secondTimePick.date !== "" && secondTimePick.month !== "") {
        secondOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, date: secondTimePick.date, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
      } else if (secondTimePick.date === "" && secondTimePick.month !== "") {
        secondOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, month: secondTimePick.month, year: secondTimePick.year.slice(-2) }).lean();
      } else if (secondTimePick.date === "" && secondTimePick.month === "") {
        secondOrdersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId, year: secondTimePick.year.slice(-2) }).lean();
      }
    }


    const secondTotalOrdered = secondOrdersByStoreFilter.length;
    const secondTotalQuantity = secondOrdersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const secondTotalRevenue = secondOrdersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);
    return res.json([{ storeName: store.name, firstStatistics: { firstTotalQuantity, firstTotalRevenue, firstTotalOrdered }, secondStatistics: { secondTotalQuantity, secondTotalRevenue, secondTotalOrdered } }])
  } catch (err) {
    console.log(err);
  }
}

const getDayOfTime = (d1, d2) => {
  let ms1 = d1.getTime();
  let ms2 = d2.getTime();
  return Math.ceil((ms2 - ms1) / (24 * 60 * 60 * 1000));
};

exports.postStatisticsGrowByStore = async (req, res) => {
  const { firstTimePickGrow, secondTimePickGrow } = req.body;
  const { storeId } = req.params;
  try {
    let ordersByStore;
    if (firstTimePickGrow.year === "2023" && secondTimePickGrow.year === "2023") {
      ordersByStore = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId }).lean();
    } else if (firstTimePickGrow.year !== "2023" && secondTimePickGrow.year !== "2023") {
      ordersByStore = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId }).lean();
    } else {
      const orders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId }).lean();
      const orders2023 = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store: storeId }).lean();
      ordersByStore = orders.concat(orders2023);
    }

    const firstTime = new Date(`${firstTimePickGrow.month}/${firstTimePickGrow.date}/${firstTimePickGrow.year}`);
    const secondTime = new Date(`${secondTimePickGrow.month}/${secondTimePickGrow.date}/${secondTimePickGrow.year}`);
    const dateNumber = getDayOfTime(firstTime, secondTime);
    const ordersByStoreGrow = [];
    if (dateNumber < 1) {
      return res.json({ message: 'Chọn thời gian không hợp lệ!', ordersByStoreGrow });
    } else {
      for (let i = 0; i <= dateNumber; i++) {
        const filterByDate = [];
        const findDate = new Date(firstTime.getTime() + 1000 * 60 * 60 * 24 * i);
        ordersByStore.forEach(order => {
          const shiftDate = getStatisticsTime(order.shiftDay);
          if (shiftDate) {
            if (shiftDate.date === findDate.getDate()?.toString() && shiftDate.month === (findDate.getMonth() + 1)?.toString() && shiftDate.year === findDate.getFullYear()?.toString()) {
              filterByDate.push({ quantity: order.quantity, revenue: order.totalPrice, payment: order.payment, app: order.app });

            }
          }
        })
        const filterByDateTotalQuantity = filterByDate.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
        const filterByDateTotalRevenue = filterByDate.reduce((sum, order) => sum += order.revenue, 0);

        const cashOrders = filterByDate.filter(order => order.payment === "cash" && !order.app);
        const totalQuantityCashOrders = cashOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
        const totalRevenueCashOrders = cashOrders.reduce((sum, order) => sum += order.revenue, 0);

        const appOrders = filterByDate.filter(order => order.payment === "cash" && order.app);
        const totalQuantityAppOrders = appOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
        const totalRevenueAppOrders = appOrders.reduce((sum, order) => sum += order.revenue, 0);

        const transferOrders = filterByDate.filter(order => order.payment === "transfer");
        const totalQuantityTransferOrders = transferOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
        const totalRevenueTransferOrders = transferOrders.reduce((sum, order) => sum += order.revenue, 0);
        ordersByStoreGrow.push({
          date: i + 1, statistics: { quantity: filterByDateTotalQuantity, revenue: filterByDateTotalRevenue, order: filterByDate.length }, cashOrders: { quantity: totalQuantityCashOrders, revenue: totalRevenueCashOrders, order: cashOrders.length }, transferOrders: { quantity: totalQuantityTransferOrders, revenue: totalRevenueTransferOrders, order: transferOrders.length },
          appOrders: { quantity: totalQuantityAppOrders, revenue: totalRevenueAppOrders, order: appOrders.length }
        });
      }
      return res.json({ ordersByStoreGrow });
    }
  } catch (err) {
    console.log(err);
  }
}

exports.getStatisticsTodayByStore = async (req, res) => {
  const { date, month, year, shift, user } = req.query;
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);
    let ordersByStore;
    if (year === "2023") {
      if (user === "") {
        ordersByStore = await Order2023.find({ store: storeId, date, month, year: year.slice(-2) }).lean().populate('store').populate({
          path: "creator",
          populate: "user",
        }).lean()
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
          }).populate("toStore")
          .populate({
            path: "toStoreOrder",
            populate: [{
              path: "creator",
              populate: {
                path: "user",
              },
            }, {
              path: "producer",
              populate: {
                path: "user",
              },
            }, {
              path: "shipper",
              populate: {
                path: "user",
              },
            }, {
              path: "confirmShip",
              populate: {
                path: "user",
              },
            }]
          })
          .populate({ path: 'transferStore', populate: ['fromStore', 'user'] });
      } else {
        ordersByStore = await Order2023.find({ store: storeId, $or: [{ $and: [{ "shipper.user": user }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user } }, { "confirmShip.user": user }] }], date, month, year: year.slice(-2) }).lean().populate('store').populate({
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
          }).populate("toStore")
          .populate({
            path: "toStoreOrder",
            populate: [{
              path: "creator",
              populate: {
                path: "user",
              },
            }, {
              path: "producer",
              populate: {
                path: "user",
              },
            }, {
              path: "shipper",
              populate: {
                path: "user",
              },
            }, {
              path: "confirmShip",
              populate: {
                path: "user",
              },
            }]
          })
          .populate({ path: 'transferStore', populate: ['fromStore', 'user'] });

      }
    } else {
      if (user === "") {
        ordersByStore = await Order.find({ store: storeId, date, month, year: year.slice(-2) }).lean().populate('store').populate({
          path: "creator",
          populate: "user",
        }).lean()
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
          }).populate("toStore")
          .populate({
            path: "toStoreOrder",
            populate: [{
              path: "creator",
              populate: {
                path: "user",
              },
            }, {
              path: "producer",
              populate: {
                path: "user",
              },
            }, {
              path: "shipper",
              populate: {
                path: "user",
              },
            }, {
              path: "confirmShip",
              populate: {
                path: "user",
              },
            }]
          })
          .populate({ path: 'transferStore', populate: ['fromStore', 'user'] });
      } else {
        ordersByStore = await Order.find({ store: storeId, $or: [{ $and: [{ "shipper.user": user }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user } }, { "confirmShip.user": user }] }], date, month, year: year.slice(-2) }).lean().populate('store').populate({
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
          }).populate("toStore")
          .populate({
            path: "toStoreOrder",
            populate: [{
              path: "creator",
              populate: {
                path: "user",
              },
            }, {
              path: "producer",
              populate: {
                path: "user",
              },
            }, {
              path: "shipper",
              populate: {
                path: "user",
              },
            }, {
              path: "confirmShip",
              populate: {
                path: "user",
              },
            }]
          })
          .populate({ path: 'transferStore', populate: ['fromStore', 'user'] });
      }
    }

    const deletedOrdersByStore = await DeletedOrder.find({ store: storeId }).lean().populate('deletor');
    if (shift === "true") {
      const deletedOrdersByStoreMorningShift = deletedOrdersByStore.filter(order => order.orderData?.shiftCode === "S" && getStatisticsTime(order.orderData.shiftDay).date === date && getStatisticsTime(order.orderData.shiftDay).month === month && getStatisticsTime(order.orderData.shiftDay).year === year);
      const deletedOrdersByStoreMorningShiftTransform = await Promise.all(deletedOrdersByStoreMorningShift.map((async order => {
        const creator = await User.findById(order.orderData.creator?.user);
        const producer = await User.findById(order.orderData.producer?.user);
        const shipper = await User.findById(order.orderData.shipper?.user);
        return ({ order, creator, producer, shipper })
      })));
      const ordersByStoreMorningShift = ordersByStore.filter(order => order.shiftCode === "S");
      const ordersByStoreMorningShiftWithUpdated = await Promise.all(ordersByStoreMorningShift.map((async order => {
        const updatedOrderDetail = await UpdatedOrder.find({ originalId: order._id }).lean().populate('editor');
        return ({ detail: order, updatedOrderDetail })
      })))
      return res.json({ store: store.name, detail: ordersByStoreMorningShiftWithUpdated, deletedDetail: deletedOrdersByStoreMorningShiftTransform });
    } else {
      const deletedOrdersByStoreAfternoonShift = deletedOrdersByStore.filter(order => order.orderData?.shiftCode === "C" && getStatisticsTime(order.orderData.shiftDay).date === date && getStatisticsTime(order.orderData.shiftDay).month === month && getStatisticsTime(order.orderData.shiftDay).year === year);
      const deletedOrdersByStoreAfternoonShiftTransform = await Promise.all(deletedOrdersByStoreAfternoonShift.map((async order => {
        const creator = await User.findById(order.orderData.creator?.user);
        const producer = await User.findById(order.orderData.producer?.user);
        const shipper = await User.findById(order.orderData.shipper?.user);
        return ({ order, creator, producer, shipper })
      })));
      const ordersByStoreAfternoonShift = ordersByStore.filter(order => order.shiftCode === "C");
      const ordersByStoreAfternoonShiftWithUpdated = await Promise.all(ordersByStoreAfternoonShift.map((async order => {
        const updatedOrderDetail = await UpdatedOrder.find({ originalId: order._id }).lean().populate('editor');
        return ({ detail: order, updatedOrderDetail })
      })))
      return res.json({ store: store.name, detail: ordersByStoreAfternoonShiftWithUpdated, deletedDetail: deletedOrdersByStoreAfternoonShiftTransform })
    }
  } catch (err) {
    console.log(err);
  }
}

exports.getUserStatisticsByStore = async (req, res) => {
  const { shift, date, month, year } = req.query;
  const { storeId } = req.params;
  try {
    const usersByStore = await User.find({ store: storeId }).lean().populate('role');
    const userArray = usersByStore.map((user) => ({ name: user.name, id: user._id, role: user.role?.description }));
    const userStatistics = await Promise.all(userArray.map(async (user) => {
      let quickPurchaseOrders;
      let transferOrders = [];
      let appOrders = [];

      let ordersCreateFilter;
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        } else {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        } else {
          if (date !== "" && month !== "") {
            ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, date, month, year: year.slice(-2), quickPurchase: true }).lean().count();

          } else if (date === "" && month !== "") {
            ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, month, year: year.slice(-2), quickPurchase: true }).lean().count();
          } else if (date === "" && month === "") {
            ordersCreateFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2) }).lean();
            quickPurchaseOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "creator.user": user.id, year: year.slice(-2), quickPurchase: true }).lean().count();
          }
        }
      }

      let ordersProduceFilter = []
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean();

          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean();

          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean();
          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, date, month, year: year.slice(-2) }).lean();

          } else if (date === "" && month !== "") {
            ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, month, year: year.slice(-2) }).lean();

          } else if (date === "" && month === "") {
            ordersProduceFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "producer.user": user.id, year: year.slice(-2) }).lean();
          }
        }
      }

      let ordersShipFilter = [];
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), app: true }).lean();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2) }).lean();
            transferOrders = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), app: true }).lean();
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), app: true }).lean();
          }

        } else {
          if (date !== "" && month !== "") {
            ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, date, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month !== "") {
            ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, month, year: year.slice(-2), app: true }).lean();

          } else if (date === "" && month === "") {
            ordersShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2) }).lean();
            transferOrders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), payment: 'transfer' }).lean();
            appOrders = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "shipper.user": user.id, "confirmShip.user": undefined, year: year.slice(-2), app: true }).lean();
          }
        }
      }

      let ordersConfirmShipFilter = [];
      if (year === "2023") {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersConfirmShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month !== "") {
            ordersConfirmShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month === "") {
            ordersConfirmShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          }

        } else {
          if (date !== "" && month !== "") {
            ordersConfirmShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month !== "") {
            ordersConfirmShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month === "") {
            ordersConfirmShipFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          }
        }
      } else {
        if (shift === "") {
          if (date !== "" && month !== "") {
            ordersConfirmShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month !== "") {
            ordersConfirmShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month === "") {
            ordersConfirmShipFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          }

        } else {
          if (date !== "" && month !== "") {
            ordersConfirmShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, date, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month !== "") {
            ordersConfirmShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, month, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          } else if (date === "" && month === "") {
            ordersConfirmShipFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2) }).lean();
            const transferOrdersConfirm = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), payment: 'transfer' }).lean();
            const appOrdersConfirm = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], "confirmShip.user": user.id, year: year.slice(-2), app: true }).lean();
            transferOrders = transferOrders.concat(transferOrdersConfirm);
            appOrders = appOrders.concat(appOrdersConfirm);
          }
        }
      }
      const ordersShipFilterTotal = ordersShipFilter.concat(ordersConfirmShipFilter);

      const quantity = ordersShipFilterTotal.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
      const revenue = ordersShipFilterTotal.reduce((sum, order) => sum += order.totalPrice, 0);

      const transferOrdersRevenue = transferOrders.reduce((sum, order) => sum += order.totalPrice, 0);
      const appOrdersRevenue = appOrders.reduce((sum, order) => sum += order.totalPrice, 0);

      return { name: user.name, role: user.role, ordersCreate: ordersCreateFilter.length, ordersProduce: ordersProduceFilter.length, ordersShip: ordersShipFilterTotal.length, revenue, quantity, quickPurchaseOrders, transferOrders: transferOrders.length, transferOrdersRevenue, appOrders: appOrders.length, appOrdersRevenue }
    }))

    return res.json(userStatistics);
  } catch (err) {
    console.log(err);
  }
}

exports.getGuestOrderByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const guestOrders = await GuestOrder.find({ store: new Types.ObjectId(storeId), status: undefined }).lean();
    const store = await Store.findById(storeId);
    store.guestOrders = guestOrders.length;
    await store.save();
    const allGuestOrders = await GuestOrder.find().lean();
    io.getIO().emit("get-all-guest-orders-quantity", allGuestOrders.length);
    return res.json(guestOrders);
  } catch (err) {
    console.log(err);
  }
}

exports.approveGuestOrderByStore = async (req, res) => {
  const { id } = req.body;
  try {
    await GuestOrder.updateOne({ _id: id }, { $set: { status: 'approved' } });
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.deleteGuestOrderByStore = async (req, res) => {
  const { id } = req.body;
  try {
    await GuestOrder.updateOne({ _id: id }, { $set: { status: 'canceled' } });
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getAllGuestOrdersQuantity = async (req, res) => {
  const allGuestOrders = await GuestOrder.find({ status: undefined }).lean();
  return res.status(200).json(allGuestOrders.length);
}