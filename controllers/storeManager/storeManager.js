const User = require("../../models/user");
const Role = require('../../models/role');
const Tag = require('../../models/tag');
const Store = require('../../models/store');
const Order = require('../../models/order');
const Order2023 = require("../../models/2023order");
const TimerOrder = require("../../models/timerOrder");
const GuestOrder = require('../../models/guestOrder');
const DeletedOrder = require("../../models/deletedOrder");
const  ZaloOrder  = require('../../models/zaloorder')
const UpdatedOrder = require("../../models/updatedOrder");
const TransferOrder = require("../../models/transferOrder");
const ReImportFreshHistory = require("../../models/reImportFreshHistory");
const CookedHistory = require("../../models/cookedHistory");
const FreshHistory = require("../../models/freshHistory");
const { Types } = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { getStatisticsTime } = require("../../utils/getTime");
const { generatePassword } = require("../admin-director/admin-director");
const io = require("../../socket");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'quequansystem@gmail.com',
    pass: process.env.NODEMAILER_PASSWORD
  }
});

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ name: { $nin: ['admin', "director", 'assistant', 'storeManager'] } });
    return res.json(roles);
  } catch (err) {
    console.log(err);
  }
}

exports.getGuestOrders = async (req, res) => {
  const store = req.user.store;
  try {
    const findStore = await Store.findById(store._id);
    const guestOrders = await GuestOrder.find({store, status: undefined})
    findStore.guestOrders = guestOrders.length;
    await findStore.save();
    io.getIO().emit(`get-guest-orders-quantity-${store._id}`, guestOrders.length);
    const allGuestOrders = await GuestOrder.find().count();
    io.getIO().emit("get-all-guest-orders-quantity", allGuestOrders);
    console.log(guestOrders)
    return res.json(guestOrders);
  } catch (err) {
    console.log(err);
  }
}

exports.approveGuestOrders = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    await GuestOrder.updateOne({ _id: id }, { $set: { status: 'approve' } });
    // Find the guest order by ID
    const guestOrder = await GuestOrder.findById(id);
    if (!guestOrder) {
      return res.status(404).json({ message: "Guest order not found" });
    }

    // Extract the guestOrder.code for use in the regex
    const guestOrderCode = guestOrder.code;
    if (!guestOrderCode) {
      return res.status(400).json({ message: "Guest order code is missing" });
    }

    // Find a ZaloOrder where order.id includes the guestOrder.code
    const zaloOrder = await ZaloOrder.findOne({ "order.id": { $regex: guestOrderCode } });
    if (!zaloOrder) {
      return res.status(404).json({ message: "No matching Zalo order found" });
    }

    // Update the order status to "approved"
    const updateResult = await ZaloOrder.updateOne(
        { _id: zaloOrder._id },
        { $set: { "order.status": "confirmed" } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ message: "Failed to update Zalo order status" });
    }

    return res.status(200).json({ message: "Order approved successfully" });
  } catch (err) {
    console.error("Error approving guest order and updating Zalo order:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteGuestOrders = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    await GuestOrder.updateOne({ _id: id }, { $set: { status: 'canceled' } });
    // Find the guest order by ID
    const guestOrder = await GuestOrder.findById(id);
    if (!guestOrder) {
      return res.status(404).json({ message: "Guest order not found" });
    }

    // Extract the guestOrder.code for use in the regex
    const guestOrderCode = guestOrder.code;
    if (!guestOrderCode) {
      return res.status(400).json({ message: "Guest order code is missing" });
    }

    // Find a ZaloOrder where order.id includes the guestOrder.code
    const zaloOrder = await ZaloOrder.findOne({ "order.id": { $regex: guestOrderCode } });
    if (!zaloOrder) {
      return res.status(404).json({ message: "No matching Zalo order found" });
    }

    // Update the order status to "approved"
    const updateResult = await ZaloOrder.updateOne(
        { _id: zaloOrder._id },
        { $set: { "order.status": "closed" } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ message: "Failed to update Zalo order status" });
    }

    return res.status(200).json({ message: "Order approved successfully" });
  } catch (err) {
    console.error("Error approving guest order and updating Zalo order:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// exports.deleteGuestOrders = async (req, res) => {
//   const { id } = req.body;
//   try {
//     await GuestOrder.updateOne({ _id: id }, { $set: { status: 'canceled' } });
//     return res.end();
//   } catch (err) {
//     console.log(err);
//   }
// }

exports.getGuestOrdersQuantity = async (req, res) => {
  try {
    const store = req.user.store;
    const guestOrdersByStore = await GuestOrder.find({ store, status: undefined });
    return res.status(200).json(guestOrdersByStore.length);
  } catch (error) {
    console.log(error);
  }
}

exports.getRemainingConfirm = async (req, res) => {
  try {
    const store = req.user.store;
    const confirmReImportFresh = await ReImportFreshHistory.find({ action: 'confirmReImportFresh', store }).count();
    const confirmReImportCookedStock = await Order.find({ $or: [{ status: 'pending-delete-produce' }, { status: 'pending-delete-ship' }, { status: 'pending-delete-success' }], store }).count();
    const confirmCheckProductStock = await CookedHistory.findOne({ action: 'checkProductStock', store }).sort({ _id: -1 }).limit(1).count();
    const confirmCheckFreshStock = await FreshHistory.findOne({ action: 'checkFreshStock', store }).sort({ _id: -1 }).limit(1).count();
    return res.status(200).json(confirmReImportFresh + confirmReImportCookedStock + confirmCheckProductStock + confirmCheckFreshStock);
  } catch (error) {
    console.log(error);
  }
}

exports.getScheduleOrderQuantity = async (req, res) => {
  try {
    const store = req.user.store;
    const timerOrderQuantity = await TimerOrder.find({ "createOrderData.store": store?._id, status: 'pending' }).count();
    return res.status(200).json(timerOrderQuantity);
  } catch (error) {
    console.log(error);
  }
}

exports.getUsers = async (req, res) => {
  const store = req.user.store;
  try {
    const users = await User.find({ role: { $nin: ["643ce869e6c312b8c449e26f", "643eaa0fd418d1fe9aefd4a7", '643cef2e162c633b558c08cd', "643cef74162c633b558c08d0"] }, store }).populate('role').populate('store');
    const usersResponse = users.map((user) => {
      return { id: user._id, email: user.email, name: user.name, role: user.role, store: user.store, photo: user.photo }
    })
    return res.json(usersResponse);
  } catch (err) {
    console.log(err);
  }
}

exports.getUsersIncludeSM = async (req, res) => {
  const store = req.user.store;
  try {
    const users = await User.find({ role: { $nin: ["643ce869e6c312b8c449e26f", "643eaa0fd418d1fe9aefd4a7", '643cef2e162c633b558c08cd'] }, store }).populate('role').populate('store');
    const usersResponse = users.map((user) => {
      return { id: user._id, email: user.email, name: user.name, role: user.role, store: user.store, photo: user.photo }
    })
    return res.json(usersResponse);
  } catch (err) {
    console.log(err);
  }
}

exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('role').populate('store');
    return res.json({ id: user._id, email: user.email, name: user.name, role: user.role, store: user.store });
  } catch (err) {
    console.log(err);
  }
}

exports.postSignupUser = async (req, res) => {
  const { email, name, roleId } = req.body;
  const store = req.user.store;
  const errors = validationResult(req);
  const randomPassword = generatePassword(8);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }
  try {
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    const role = new Types.ObjectId(roleId);
    const roleData = await Role.findById(role);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      store,
      photo: "https://i.ibb.co/BffwmfT/user.png"
    });
    await user.save();
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
  const { roleId } = (req.body);
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    user.role = new Types.ObjectId(roleId);
    await user.save();
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

exports.getStoreById = async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);
    return res.json(store);

  } catch (err) {
    console.log(err);
  }
}

exports.putEditStore = async (req, res) => {
  const { storeId } = req.params;
  const { bank, account_name, account_number, phone } = req.body;
  try {
    const store = await Store.findById(storeId);
    store.bank = bank;
    store.account_name = account_name;
    store.account_number = account_number;
    store.phone = phone;
    await store.save();
    return res.json({ message: 'Cập nhật cửa hàng thành công' })

  } catch (err) {
    console.log(err);
  }
}

exports.getTagsByStore = async (req, res) => {
  const { storeId } = req.params
  try {
    const tags = await Tag.find({ store: storeId }).lean().sort({ index: 1 });
    return res.json(tags);
  } catch (err) {
    console.log(err);
  }
}

exports.getStatisticsByStore = async (req, res) => {
  const { shift, date, month, year } = req.query;
  try {
    const store = await Store.findById(req.user.store);

    let ordersByStoreFilter;
    if (year === "2023") {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, year: year.slice(-2) }).lean();
        }
      } else {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order2023.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, year: year.slice(-2) }).lean();
        }
      }
    } else {
      if (shift === "") {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, year: year.slice(-2) }).lean();
        }
      } else {
        if (date !== "" && month !== "") {
          ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, date, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month !== "") {
          ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, month, year: year.slice(-2) }).lean();
        } else if (date === "" && month === "") {
          ordersByStoreFilter = await Order.find({ shiftCode: shift, $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', "transfer"] }], store, year: year.slice(-2) }).lean();
        }
      }
    }


    const totalOrdered = ordersByStoreFilter.length;
    const totalQuantity = ordersByStoreFilter.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenue = ordersByStoreFilter.reduce((sum, order) => sum += order.totalPrice, 0);

    const cashOrders = ordersByStoreFilter.filter(order => order.payment === "cash" && !order.app);
    const totalQuantityCashOrders = cashOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenueCashOrders = cashOrders.reduce((sum, order) => sum += order.totalPrice, 0);

    const appOrders = ordersByStoreFilter.filter(order => order.payment === "cash" && order.app);
    const totalQuantityAppOrders = appOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenueAppOrders = appOrders.reduce((sum, order) => sum += order.totalPrice, 0);

    const transferOrders = ordersByStoreFilter.filter(order => order.payment === "transfer");
    const totalQuantityTransferOrders = transferOrders.reduce((sum, order) => sum += order.quantity, 0).toFixed(1);
    const totalRevenueTransferOrders = transferOrders.reduce((sum, order) => sum += order.totalPrice, 0);
    return res.json({
      storeName: store.name, statistics: { totalOrdered, totalQuantity, totalRevenue }, cashOrders: { totalOrdered: cashOrders.length, totalQuantity: totalQuantityCashOrders, totalRevenue: totalRevenueCashOrders }, transferOrders: { totalOrdered: transferOrders.length, totalQuantity: totalQuantityTransferOrders, totalRevenue: totalRevenueTransferOrders },
      appOrders: { totalOrdered: appOrders.length, totalQuantity: totalQuantityAppOrders, totalRevenue: totalRevenueAppOrders }
    });
  } catch (err) {
    console.log(err);
  }
}

exports.getStatisticsByStoreToday = async (req, res) => {
  const { date, month, year, shift, user } = req.query;
  let ordersByStore;
  try {
    if (year === "2023") {
      if (user === "") {
        ordersByStore = await Order2023.find({ store: req.user.store, date, month, year: year.slice(-2) }).lean().populate('store').populate({
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
            })
            .populate("toStore")
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
        ordersByStore = await Order2023.find({ store: req.user.store, $or: [{ $and: [{ "shipper.user": user }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user } }, { "confirmShip.user": user }] }], date, month, year: year.slice(-2) }).lean().populate('store').populate({
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
        ordersByStore = await Order.find({ store: req.user.store, date, month, year: year.slice(-2) }).lean().populate('store').populate({
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
      } else {
        ordersByStore = await Order.find({ store: req.user.store, $or: [{ $and: [{ "shipper.user": user }, { "confirmShip.user": undefined }] }, { $and: [{ "shipper.user": { $ne: user } }, { "confirmShip.user": user }] }], date, month, year: year.slice(-2) }).lean().populate('store').populate({
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

    const deletedOrdersByStore = await DeletedOrder.find({ store: req.user.store }).lean().populate('deletor');

    if (shift === "true") {
      const deletedOrdersByStoreMorningShift = deletedOrdersByStore.filter(order => order.orderData?.shiftCode === "S" && getStatisticsTime(order.orderData.shiftDay).date === date && getStatisticsTime(order.orderData.shiftDay).month === month && getStatisticsTime(order.orderData.shiftDay).year === year);
      const deletedOrdersByStoreMorningShiftTransform = await Promise.all(deletedOrdersByStoreMorningShift.map((async order => {
        const creator = await User.findById(order.orderData.creator?.user).lean();
        const producer = await User.findById(order.orderData.producer?.user).lean();
        const shipper = await User.findById(order.orderData.shipper?.user).lean();
        return ({ order, creator, producer, shipper })
      })));
      const ordersByStoreMorningShift = ordersByStore.filter(order => order?.shiftCode === "S");
      const ordersByStoreMorningShiftWithUpdated = await Promise.all(ordersByStoreMorningShift.map((async order => {
        const updatedOrderDetail = await UpdatedOrder.find({ originalId: order._id }).lean().populate('editor');
        return ({ detail: order, updatedOrderDetail })
      })))
      return res.json({ detail: ordersByStoreMorningShiftWithUpdated, deletedDetail: deletedOrdersByStoreMorningShiftTransform });
    } else {
      const deletedOrdersByStoreAfternoonShift = deletedOrdersByStore.filter(order => order.orderData?.shiftCode === "C" && getStatisticsTime(order.orderData.shiftDay).date === date && getStatisticsTime(order.orderData.shiftDay).month === month && getStatisticsTime(order.orderData.shiftDay).year === year);
      const deletedOrdersByStoreAfternoonShiftTransform = await Promise.all(deletedOrdersByStoreAfternoonShift.map((async order => {
        const creator = await User.findById(order.orderData.creator?.user).lean();
        const producer = await User.findById(order.orderData.producer?.user).lean();
        const shipper = await User.findById(order.orderData.shipper?.user).lean();
        return ({ order, creator, producer, shipper })
      })));
      const ordersByStoreAfternoonShift = ordersByStore.filter(order => order?.shiftCode === "C");
      const ordersByStoreAfternoonShiftWithUpdated = await Promise.all(ordersByStoreAfternoonShift.map((async order => {
        const updatedOrderDetail = await UpdatedOrder.find({ originalId: order._id }).lean().populate('editor');
        return ({ detail: order, updatedOrderDetail })
      })))
      return res.json({ detail: ordersByStoreAfternoonShiftWithUpdated, deletedDetail: deletedOrdersByStoreAfternoonShiftTransform })
    }
  } catch (err) {
    console.log(err);
  }
}

exports.postStatisticsCompareByStore = async (req, res) => {
  const { firstTimePick, secondTimePick } = req.body;
  const storeId = req.user.store;
  try {
    const store = await Store.findById(storeId).lean();

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
  const store = req.user.store;
  try {
    let ordersByStore;
    if (firstTimePickGrow.year === "2023" && secondTimePickGrow.year === "2023") {
      ordersByStore = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store }).lean();
    } else if (firstTimePickGrow.year !== "2023" && secondTimePickGrow.year !== "2023") {
      ordersByStore = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store }).lean();
    } else {
      const orders = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store }).lean();
      const orders2023 = await Order2023.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], store }).lean();
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
          if (shiftDate.date === findDate.getDate()?.toString() && shiftDate.month === (findDate.getMonth() + 1)?.toString() && shiftDate.year === findDate.getFullYear()?.toString()) {
            filterByDate.push({ quantity: order.quantity, revenue: order.totalPrice, payment: order.payment, app: order.app });
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

exports.getTransferOrderStatisticsByStore = async (req, res) => {
  try {
    const { firstTimePickGrow, secondTimePickGrow } = req.body;
    const firstTime = new Date(`${firstTimePickGrow.month}/${firstTimePickGrow.date}/${firstTimePickGrow.year}`);
    const secondTime = new Date(`${secondTimePickGrow.month}/${secondTimePickGrow.date}/${secondTimePickGrow.year}`);
    const dateNumber = getDayOfTime(firstTime, secondTime);
    const allStores = await Store.find({ $nor: [{ _id: req.user.store }] }).lean();
    const statisticsRes = []
    if (dateNumber < 0) {
      return res.json({ message: 'Chọn thời gian không hợp lệ!', statistics: statisticsRes });
    } else {

      const statistics = await Promise.all(allStores.map(async store => {
        const transferOrder = await TransferOrder.find({ fromStore: req.user.store, toStore: store }).lean().populate('orderDetail');
        const receiveOrder = await TransferOrder.find({ fromStore: store, toStore: req.user.store }).lean().populate('orderDetail');
        let transferOrderQuantity = 0;
        let receiveOrderQuantity = 0;
        const transferOrderDetail = [];
        const receiveOrderDetail = [];
        for (let i = 0; i <= dateNumber; i++) {
          //THỐNG KÊ ĐƠN CHUYỂN
          const findDate = new Date(firstTime.getTime() + 1000 * 60 * 60 * 24 * i);
          transferOrder.forEach(async order => {
            const shiftDate = getStatisticsTime(order.shiftDay);
            if (shiftDate.date === findDate.getDate()?.toString() && shiftDate.month === (findDate.getMonth() + 1)?.toString() && shiftDate.year === findDate.getFullYear()?.toString()) {
              transferOrderQuantity += order.quantity;
              transferOrderDetail.push(order.orderDetail);
            }
          });

          //THỐNG KÊ ĐƠN NHẬN
          receiveOrder.forEach(async order => {
            const shiftDate = getStatisticsTime(order.shiftDay);
            if (shiftDate.date === findDate.getDate()?.toString() && shiftDate.month === (findDate.getMonth() + 1)?.toString() && shiftDate.year === findDate.getFullYear()?.toString()) {
              receiveOrderQuantity += order.quantity;
              receiveOrderDetail.push(order.orderDetail);
            }
          });
        }
        return ({ store: store.name, transferOrder: transferOrderQuantity.toFixed(1), receiveOrder: receiveOrderQuantity.toFixed(1), transferOrderDetail, receiveOrderDetail });
      }))
      return res.json({ statistics });
    }
  } catch (err) {
    console.log(err);
  }
}
