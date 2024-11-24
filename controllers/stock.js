const { Types } = require('mongoose');
const MainStock = require('../models/mainStock');
const Product = require('../models/product');
const SubStock = require('../models/subStock');
const CookedHistory = require("../models/cookedHistory");
const SoldHistory = require("../models/soldHistory");
const FreshHistory = require('../models/freshHistory');
const Order = require("../models/order");
const ReImportFreshHistory = require("../models/reImportFreshHistory");
const ReImportCookedHistory = require("../models/reImportCookedHistory");
const Store = require("../models/store");
const io = require("../socket");
const { domain } = require('../utils/constant');
const { transformLocalDateString, transformLocalDateTimeString, checkShiftTime } = require('../utils/getTime');


exports.getMainStockParams = async (req, res) => {
  try {
    const mainStockParams = await MainStock.find();
    return res.status(200).json(mainStockParams);
  }
  catch (err) {
    console.log(err);
  }
}

exports.editMainStockParams = async (req, res) => {
  try {
    const { maxCapacity, manufacturePlan } = req.body;
    const mainStock = await MainStock.findById("64ae1029c59e9a218183feee");
    mainStock.maxCapacity = +maxCapacity;
    mainStock.manufacturePlan = +manufacturePlan;
    await mainStock.save();
    return res.end();
  }
  catch (err) {
    console.log(err);
  }
}

exports.getSubStockParams = async (req, res) => {
  try {
    const { storeId } = req.params;
    const subStockParams = await SubStock.find({ store: new Types.ObjectId(storeId) });
    return res.status(200).json(subStockParams);
  }
  catch (err) {
    console.log(err);
  }
}

exports.editSubStockParams = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { maxCapacity, lossRatio, averageConsumption } = req.body;
    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });
    subStock.maxCapacity = +maxCapacity;
    subStock.lossRatio = +lossRatio;
    subStock.averageConsumption = +averageConsumption;
    await subStock.save();
    return res.end();
  }
  catch (err) {
    console.log(err);
  }
}

exports.freshExport = async (req, res) => {
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const { storeId } = req.params;
    const { data, freshExportPhoto } = req.body;
    const checkShift = checkShiftTime();
    const shiftDay = checkShift.shiftDay;
    const shiftCode = checkShift.morningShift ? 'S' : 'C';
    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });
    const findPendingFreshHistory = await FreshHistory.findOne({ store: new Types.ObjectId(storeId), action: 'checkFreshStock' });
    if (findPendingFreshHistory) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho sống' })
    }

    if (+(+data - subStock.freshInventory).toFixed(4) > 0.0000) {
      return res.json({ message: 'Không đủ số lượng nem sống!' })
    }

    const freshHistory = new FreshHistory({
      action: 'freshExport',
      quantity: data,
      remainingCookedQuantity: data,
      shiftDay,
      shiftCode,
      freshExportPhoto: imageUrl,
      store: new Types.ObjectId(storeId),
      timeStamp: transformLocalDateTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(req.user.userId)

    });
    await freshHistory.save();

    freshHistory.freshBalance = subStock.freshInventory - +data;
    await freshHistory.save();

    await SubStock.updateOne({ store: storeId }, { $set: { freshInventory: freshHistory.freshBalance } });

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.reImportFresh = async (req, res) => {
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const { storeId } = req.params;
    const { id, quantity, reImportReason, reImportFreshPhoto } = req.body;
    const findPendingFreshHistory = await FreshHistory.findOne({ store: new Types.ObjectId(storeId), action: 'checkFreshStock' });
    if (findPendingFreshHistory) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho sống' })
    }
    const findFreshExportAction = await FreshHistory.findById(id);
    findFreshExportAction.reImportFresh = true;
    await findFreshExportAction.save();

    const reImportFreshHistory = new ReImportFreshHistory({
      action: 'confirmReImportFresh',
      quantity,
      reImportFreshPhoto: imageUrl,
      store: new Types.ObjectId(storeId),
      user: new Types.ObjectId(req.user.userId),
      reImportFreshReason: reImportReason,
      oldReImportFreshId: id,
    });
    await reImportFreshHistory.save();
    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.confirmReImportFresh = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { id } = req.body;
    const findPendingFreshHistory = await FreshHistory.findOne({ store: new Types.ObjectId(storeId), action: 'checkFreshStock' });
    if (findPendingFreshHistory) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho sống' })
    }
    const checkShift = checkShiftTime();
    const shiftDay = checkShift.shiftDay;
    const shiftCode = checkShift.morningShift ? 'S' : 'C';
    const findStockHistory = await ReImportFreshHistory.findById(id);
    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });

    findStockHistory.action = 'reImportFresh';
    findStockHistory.timeStamp = transformLocalDateTimeString(new Date());
    findStockHistory.timeStampHistory = Date.now();
    findStockHistory.shiftDay = shiftDay;
    findStockHistory.shiftCode = shiftCode;
    findStockHistory.freshBalance = subStock.freshInventory + findStockHistory.quantity;
    await findStockHistory.save();

    await SubStock.updateOne({ store: storeId }, { $set: { freshInventory: findStockHistory.freshBalance } });

    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.cancelReImportFresh = async (req, res) => {
  try {
    const { id } = req.body;
    const { storeId } = req.params;
    const findStockHistory = await ReImportFreshHistory.findById(id);
    const findOldReImportFresh = await FreshHistory.findById(findStockHistory.oldReImportFreshId);
    findOldReImportFresh.reImportFresh = false;
    await findOldReImportFresh.save();
    await ReImportFreshHistory.findByIdAndDelete(id);
    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
    return res.end();
  } catch (err) {
    console.log(err)
  }
}

exports.cancelCheckFreshStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    await FreshHistory.updateMany({ action: 'checkFreshStock', store: new Types.ObjectId(storeId) }, { action: 'confirmCheckFreshStock' });
    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
    return res.end();
  } catch (err) {
    console.log(err)
  }
}

exports.cancelCheckProductStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    await CookedHistory.updateMany({ action: 'checkProductStock', store: new Types.ObjectId(storeId) }, { action: 'confirmCheckProductStock' });
    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
    return res.end();
  } catch (err) {
    console.log(err)
  }
}

exports.grill = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { id, cookedQuantity } = req.body;
    const checkShift = checkShiftTime();
    const shiftDay = checkShift.shiftDay;
    const shiftCode = checkShift.morningShift ? 'S' : 'C';
    const findPendingCookedHistory = await CookedHistory.findOne({ store: new Types.ObjectId(storeId), action: 'checkProductStock' });
    if (findPendingCookedHistory) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho chín' })
    }

    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });

    const findFreshExportAction = await FreshHistory.findById(id);
    if (+(+cookedQuantity - findFreshExportAction.remainingCookedQuantity).toFixed(4) === 0.0000) {
      findFreshExportAction.cooked = true;
      findFreshExportAction.remainingCookedQuantity = 0;
      await findFreshExportAction.save();
    } else if (+(+cookedQuantity - findFreshExportAction.remainingCookedQuantity).toFixed(4) < 0.0000) {
      findFreshExportAction.remainingCookedQuantity -= +cookedQuantity;
      await findFreshExportAction.save();
    } else {
      return res.end();
    }

    const cookedHistory = new CookedHistory({
      action: 'cooked',
      quantity: (+cookedQuantity * (1 - subStock.lossRatio / 100)),
      beforeCookedQuantity: +cookedQuantity,
      shiftDay,
      shiftCode,
      store: new Types.ObjectId(storeId),
      timeStamp: transformLocalDateTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(req.user.userId),
      cookedBalance: subStock.cookedInventory + (+cookedQuantity * (1 - subStock.lossRatio / 100))
    });
    await cookedHistory.save();
    await SubStock.updateOne({ store: storeId }, { $set: { cookedInventory: cookedHistory.cookedBalance } })

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getFreshStockHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { shift, date, month, year } = req.query;
    const shiftDay = transformLocalDateString(new Date(`${month}/${date}/${year}`));
    let freshHistory;
    let reImportFreshHistory;
    if (shift === "true") {
      freshHistory = await FreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      reImportFreshHistory = await ReImportFreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user');
    } else {
      freshHistory = await FreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      reImportFreshHistory = await ReImportFreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user');
    }
    const stockHistoryResponse = freshHistory.concat(reImportFreshHistory);
    return res.status(200).json(stockHistoryResponse.sort((a, b) => b.timeStampHistory - a.timeStampHistory));
  } catch (err) {
    console.log(err);
  }
}

exports.getProductStockHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { shift, date, month, year } = req.query;
    const shiftDay = transformLocalDateString(new Date(`${month}/${date}/${year}`));
    let soldHistory;
    let cookedHistory;
    let reImportCookedHistory;

    if (shift === "true") {
      soldHistory = await SoldHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user');
      cookedHistory = await CookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      reImportCookedHistory = await ReImportCookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user');
    } else {
      soldHistory = await SoldHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user');
      cookedHistory = await CookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      reImportCookedHistory = await ReImportCookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user');
    }
    const stockHistoryResponse = soldHistory.concat(cookedHistory).concat(reImportCookedHistory);
    return res.status(200).json(stockHistoryResponse.sort((a, b) => b.timeStampHistory - a.timeStampHistory));
  } catch (err) {
    console.log(err);
  }
}

exports.getAllStockHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const stockHistory = await FreshHistory.find({ store: new Types.ObjectId(storeId) }).lean().populate('user');
    return res.status(200).json(stockHistory.sort((a, b) => b.timeStampHistory - a.timeStampHistory));
  } catch (err) {
    console.log(err);
  }
}

exports.getViewStockHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { shift, date, month, year } = req.query;
    const shiftDay = transformLocalDateString(new Date(`${month}/${date}/${year}`));
    let freshHistory;
    let reImportFreshHistory;
    let reImportCookedHistory;
    let cookedHistory;
    let soldHistory;
    if (shift === "true") {
      freshHistory = await FreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      reImportFreshHistory = await ReImportFreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user');
      reImportCookedHistory = await ReImportCookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user');
      cookedHistory = await CookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      soldHistory = await SoldHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'S', shiftDay }).lean().populate('user');
    } else {
      freshHistory = await FreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      reImportFreshHistory = await ReImportFreshHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user');
      reImportCookedHistory = await ReImportCookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user');
      cookedHistory = await CookedHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
      soldHistory = await SoldHistory.find({ store: new Types.ObjectId(storeId), shiftCode: 'C', shiftDay }).lean().populate('user');
    }
    const stockHistoryResponse = freshHistory.concat(reImportFreshHistory).concat(cookedHistory).concat(soldHistory).concat(reImportCookedHistory);
    return res.status(200).json(stockHistoryResponse.sort((a, b) => b.timeStampHistory - a.timeStampHistory));
  } catch (err) {
    console.log(err);
  }
}


exports.confirmSellExportStock = async (req, res) => {
  try {
    const { id } = req.body;
    const confirmSellExportOrders = await Order.findById(id);
    confirmSellExportOrders.status = 'confirm-produce';
    await confirmSellExportOrders.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.confirmReImportCookedStock = async (req, res) => {
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const { storeId } = req.params;
    const confirmCheckStock = await CookedHistory.findOne({ action: 'checkProductStock', store: new Types.ObjectId(storeId) }).sort({ _id: -1 }).limit(1).populate('user');
    if (confirmCheckStock) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho chín' });
    }
    const { id, user, deleteMultiPhoto } = req.body;
    const confirmReImportCookedOrder = await Order.findById(id);
    if (confirmReImportCookedOrder.status === "pending-delete-produce") {
      confirmReImportCookedOrder.status = 'confirm-delete-produce';
    } else if (confirmReImportCookedOrder.status === "pending-delete-ship") {
      confirmReImportCookedOrder.status = 'confirm-delete-ship';
    } else if (confirmReImportCookedOrder.status === "pending-delete-success") {
      confirmReImportCookedOrder.status = 'confirm-delete-success';
    }
    await confirmReImportCookedOrder.save();

    const subStock = await SubStock.findOne({ store: confirmReImportCookedOrder.store });

    const cookedHistory = new ReImportCookedHistory({
      action: 'reImportCooked',
      quantity: confirmReImportCookedOrder.quantity,
      orderId: confirmReImportCookedOrder._id,
      shiftDay: confirmReImportCookedOrder.shiftDay,
      shiftCode: confirmReImportCookedOrder.shiftCode,
      shiftIndex: confirmReImportCookedOrder.shiftIndex,
      store: confirmReImportCookedOrder.store,
      timeStamp: transformLocalDateTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(user),
      deleteReason: confirmReImportCookedOrder.deleteReason,
      deleteMultiPhoto: imageUrl,
      cookedBalance: subStock.cookedInventory + confirmReImportCookedOrder.quantity
    });
    await cookedHistory.save();
    await SubStock.updateOne({ store: confirmReImportCookedOrder.store }, { $inc: { cookedInventory: confirmReImportCookedOrder.quantity } })

    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmSellExportStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmSellExportOrders = await Order.find({ status: ['pending-produce', 'pending-produce-quick'], store: new Types.ObjectId(storeId) }).populate({ path: 'creator', populate: 'user' });
    return res.status(200).json(confirmSellExportOrders);
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmSellExport = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmSellExportOrders = await Order.find({ status: 'confirm-produce', store: new Types.ObjectId(storeId) }).populate({ path: 'creator', populate: 'user' });
    return res.status(200).json(confirmSellExportOrders);
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmReImportFresh = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmReImportFresh = await FreshHistory.find({ action: 'confirmReImportFresh', store: new Types.ObjectId(storeId) }).populate('user');
    const confirmReImportFreshUnique = await ReImportFreshHistory.find({ action: 'confirmReImportFresh', store: new Types.ObjectId(storeId) }).populate('user');
    return res.status(200).json(confirmReImportFresh.concat(confirmReImportFreshUnique));
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmReImportCookedStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmReImportCookedStock = await Order.find({ $or: [{ status: 'pending-delete-produce' }, { status: 'pending-delete-ship' }, { status: 'pending-delete-success' }], store: new Types.ObjectId(storeId) }).populate('deletor');
    return res.status(200).json(confirmReImportCookedStock);
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmReImportCooked = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmReImportCookedStock = await Order.find({ status: 'confirm-delete', store: new Types.ObjectId(storeId) }).populate('deletor');
    return res.status(200).json(confirmReImportCookedStock);
  } catch (err) {
    console.log(err);
  }
}

exports.checkFreshStock = async (req, res) => {
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const { storeId } = req.params;
    const { quantity, checkStockMultiPicture } = req.body;
    const checkShift = checkShiftTime();
    const shiftDay = checkShift.shiftDay;
    const shiftCode = checkShift.morningShift ? 'S' : 'C';
    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });

    const freshHistory = new FreshHistory({
      action: 'checkFreshStock',
      quantity,
      shiftDay,
      shiftCode,
      store: new Types.ObjectId(storeId),
      timeStamp: transformLocalDateTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(req.user.userId),
      checkStockMultiPicture: imageUrl,
      checkStockSystem: subStock.freshInventory
    });
    await freshHistory.save();

    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.editCheckFreshStock = async (req, res) => {
  try {
    const { editCheckStock, id } = req.body;
    await FreshHistory.updateOne({ _id: id, confirmCheckStock: undefined }, { $set: { quantity: +editCheckStock } });
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.editCheckProductStock = async (req, res) => {
  try {
    const { editCheckStock, id } = req.body;
    await CookedHistory.updateOne({ _id: id, confirmCheckStock: undefined }, { $set: { quantity: +editCheckStock } });
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.checkProductStock = async (req, res) => {
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const { storeId } = req.params;
    const checkLegit = await FreshHistory.find({ store: new Types.ObjectId(storeId) });
    if (checkLegit.filter(
      (item) =>
        (item.action === "freshExport" &&
          !item.reImportFresh &&
          !item.cooked) ||
        item.action === "confirmReImportFresh"
    ).length > 0) {
      return res.json({ message: "Chưa hoàn tất nướng hoặc tái nhập sống!" });
    }
    const { quantity, checkStockMultiPicture } = req.body;
    const checkShift = checkShiftTime();
    const shiftDay = checkShift.shiftDay;
    const shiftCode = checkShift.morningShift ? 'S' : 'C';
    const subStock = await SubStock.findOne({ store: new Types.ObjectId(storeId) });
    const cookedHistory = new CookedHistory({
      action: 'checkProductStock',
      quantity,
      shiftDay,
      shiftCode,
      store: new Types.ObjectId(storeId),
      timeStamp: transformLocalDateTimeString(new Date()),
      timeStampHistory: Date.now(),
      user: new Types.ObjectId(req.user.userId),
      checkStockMultiPicture: imageUrl,
      checkStockSystem: subStock.cookedInventory
    });
    await cookedHistory.save();

    io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);

    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmCheckProductStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmCheckStock = await CookedHistory.findOne({ action: 'checkProductStock', store: new Types.ObjectId(storeId) }).lean().sort({ _id: -1 }).limit(1).populate('user');
    return res.status(200).json(confirmCheckStock);
  } catch (err) {
    console.log(err);
  }
}

exports.getConfirmCheckFreshStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    const confirmCheckStock = await FreshHistory.findOne({ action: 'checkFreshStock', store: new Types.ObjectId(storeId) }).lean().sort({ _id: -1 }).limit(1).populate('user');
    return res.status(200).json(confirmCheckStock);
  } catch (err) {
    console.log(err);
  }
}

exports.confirmCheckProductStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { cookedInventory, id } = req.body;
    await SubStock.updateOne({ store: storeId }, { $set: { cookedInventory: cookedInventory } });
    const checkUpdated = await SubStock.findOne({ store: storeId, cookedInventory });
    if (checkUpdated) {
      const recordHistory = await CookedHistory.findById(id);
      recordHistory.checkStockRecord = true;
      recordHistory.confirmCheckStock = {
        timeStamp: transformLocalDateTimeString(new Date()),
        user: new Types.ObjectId(req.user.userId)
      }
      recordHistory.timeStampHistory = Date.now()
      await recordHistory.save();
      await CookedHistory.updateMany({ action: 'checkProductStock', store: new Types.ObjectId(storeId) }, { action: 'confirmCheckProductStock' });

      io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);
      return res.end();
    } else {
      return res.json({ message: 'Có lỗi xảy ra, vui lòng thử lại' })
    }
  } catch (err) {
    console.log(err);
  }
}

exports.confirmCheckFreshStock = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { freshInventory, id } = req.body;
    await SubStock.updateOne({ store: storeId }, { $set: { freshInventory: freshInventory } });
    const checkUpdated = await SubStock.findOne({ store: storeId, freshInventory });
    if (checkUpdated) {
      const recordHistory = await FreshHistory.findById(id);
      recordHistory.checkStockRecord = true;
      recordHistory.confirmCheckStock = {
        timeStamp: transformLocalDateTimeString(new Date()),
        user: new Types.ObjectId(req.user.userId)
      }
      recordHistory.timeStampHistory = Date.now()
      await recordHistory.save();
      await FreshHistory.updateMany({ action: 'checkFreshStock', store: new Types.ObjectId(storeId) }, { action: 'confirmCheckFreshStock' });

      io.getIO().emit(`get-confirm-orders-quantity-${storeId}`);

      return res.end();
    } else {
      return res.json({ message: 'Có lỗi xảy ra, vui lòng thử lại' })
    }
  } catch (err) {
    console.log(err);
  }
}

exports.getStockStatisticsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { firstTimePick, secondTimePick } = req.body;
    const firstTime = transformLocalDateString(new Date(`${firstTimePick.month}/${firstTimePick.date}/${firstTimePick.year}`));
    const secondTime = transformLocalDateString(new Date(`${secondTimePick.month}/${secondTimePick.date}/${secondTimePick.year}`));
    const startShiftFirstTime = new Date(`${firstTime}, 09:00 PM`).getTime() - 86400000;
    const endShiftSecondTime = new Date(`${secondTime}, 09:00 PM`).getTime();
    // Query tồn kho sống, tồn kho chín đầu kỳ, cuối kỳ
    let endFreshInventory;
    let endCookedInventory;

    //Tồn nem sống đầu kỳ
    const endShiftBeforeFreshInventory = await FreshHistory.find({ store: new Types.ObjectId(storeId), $or: [{ freshBalance: { $nin: undefined } }, { checkStockRecord: { $nin: undefined } }], timeStampHistory: { $lt: startShiftFirstTime } }).lean().sort({ _id: -1 }).limit(1);
    const endShiftBeforeReImportFresh = await ReImportFreshHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $lt: startShiftFirstTime } }).lean().sort({ _id: -1 }).limit(1);
    const endShiftBeforeFreshInventoryItem = endShiftBeforeFreshInventory.concat(endShiftBeforeReImportFresh).sort((a, b) => b.timeStampHistory - a.timeStampHistory)[0];

    let beginFreshInventory;
    if (endShiftBeforeFreshInventoryItem && endShiftBeforeFreshInventoryItem.action !== "confirmCheckFreshStock") {
      beginFreshInventory = endShiftBeforeFreshInventoryItem.freshBalance.toFixed(1);
    } else if (endShiftBeforeFreshInventoryItem && endShiftBeforeFreshInventoryItem.action === "confirmCheckFreshStock") {
      beginFreshInventory = endShiftBeforeFreshInventoryItem.quantity.toFixed(1);
    }

    const endFreshInventoryItemObject = await FreshHistory.find({ store: new Types.ObjectId(storeId), $or: [{ freshBalance: { $nin: undefined } }, { checkStockRecord: { $nin: undefined } }], timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).limit(1);
    const endReImportFreshInventoryObject = await ReImportFreshHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).limit(1);
    const endFreshInventoryItem = endFreshInventoryItemObject.concat(endReImportFreshInventoryObject).sort((a, b) => b.timeStampHistory - a.timeStampHistory)[0];

    if (endFreshInventoryItem && endFreshInventoryItem.action !== "confirmCheckFreshStock") {
      endFreshInventory = endFreshInventoryItem.freshBalance.toFixed(1);
    } else if (endFreshInventoryItem && endFreshInventoryItem.action === "confirmCheckFreshStock") {
      endFreshInventory = endFreshInventoryItem.quantity.toFixed(1);
    } else {
      endFreshInventory = beginFreshInventory;
    }

    //Tồn nem chín đầu kỳ
    const endShiftBeforeCookedInventory = await CookedHistory.find({ store: new Types.ObjectId(storeId), $or: [{ cookedBalance: { $nin: undefined } }, { checkStockRecord: { $nin: undefined } }], timeStampHistory: { $lt: startShiftFirstTime } }).lean().sort({ _id: -1 }).limit(1);
    const endShiftBeforeSoldHistory = await SoldHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $lt: startShiftFirstTime } }).lean().sort({ _id: -1 }).limit(1);
    const endShiftBeforeReImportCookedHistory = await ReImportCookedHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $lt: startShiftFirstTime } }).lean().sort({ _id: -1 }).limit(1);
    const endShiftBeforeCookedInventoryItem = endShiftBeforeCookedInventory.concat(endShiftBeforeSoldHistory).concat(endShiftBeforeReImportCookedHistory).sort((a, b) => b.timeStampHistory - a.timeStampHistory)[0];
    let beginCookedInventory;
    if (endShiftBeforeCookedInventoryItem && endShiftBeforeCookedInventoryItem.action !== "confirmCheckProductStock") {
      beginCookedInventory = endShiftBeforeCookedInventoryItem.cookedBalance.toFixed(1);
    } else if (endShiftBeforeCookedInventoryItem && endShiftBeforeCookedInventoryItem.action === "confirmCheckProductStock") {
      beginCookedInventory = endShiftBeforeCookedInventoryItem.quantity.toFixed(1);
    }

    const endCookedInventoryItemObject = await CookedHistory.find({ store: new Types.ObjectId(storeId), $or: [{ cookedBalance: { $nin: undefined } }, { checkStockRecord: { $nin: undefined } }], timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).limit(1);
    const endSoldHistoryObject = await SoldHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).limit(1);
    const endReImportCookedHistoryObject = await ReImportCookedHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).limit(1);
    const endCookedInventoryItem = endCookedInventoryItemObject.concat(endSoldHistoryObject).concat(endReImportCookedHistoryObject).sort((a, b) => b.timeStampHistory - a.timeStampHistory)[0];
    if (endCookedInventoryItem && endCookedInventoryItem.action !== "confirmCheckProductStock") {
      endCookedInventory = endCookedInventoryItem.cookedBalance.toFixed(1);
    } else if (endCookedInventoryItem && endCookedInventoryItem.action === "confirmCheckProductStock") {
      endCookedInventory = endCookedInventoryItem.quantity.toFixed(1);
    } else {
      endCookedInventory = beginCookedInventory;
    }

    //Query tổng nhập sống
    const mainStockExportArray = await Product.find({ action: 'export', "request.store": new Types.ObjectId(storeId), "request.status": 'complete', timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const mainStockExport = mainStockExportArray.reduce((sum, item) => sum += item.quantity, 0).toFixed(1);
    const weighedMainStockExport = mainStockExportArray.reduce((sum, item) => sum += item.request.quantity ? item.request.quantity : 0, 0).toFixed(1);

    //Query xuất chín bán hàng
    const soldHistoryArray = await SoldHistory.find({ store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const soldHistory = soldHistoryArray.reduce((sum, item) => sum += item.quantity, 0).toFixed(1);

    //Query tái nhập chín
    const reImportCookedArray = await ReImportCookedHistory.find({ action: 'reImportCooked', store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const reImportCooked = reImportCookedArray.reduce((sum, item) => sum += item.quantity, 0).toFixed(1);

    //Query xuất nướng
    const grillArray = await FreshHistory.find({ action: 'freshExport', store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const grill = grillArray.reduce((sum, item) => sum += item.quantity, 0).toFixed(1);

    //Query thành phẩm
    const cookedArray = await CookedHistory.find({ action: 'cooked', store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const cooked = cookedArray.reduce((sum, item) => sum += item.quantity, 0).toFixed(1);

    //Query tái nhập sống
    const reImportFreshArray = await ReImportFreshHistory.find({ action: 'reImportFresh', store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const reImportFresh = reImportFreshArray.reduce((sum, item) => sum += item.quantity, 0).toFixed(1);

    //Query kiểm kho sống
    const checkFreshStockArray = await FreshHistory.find({ action: 'confirmCheckFreshStock', checkStockRecord: true, store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const checkFreshStock = checkFreshStockArray.reduce((sum, item) => sum += item.quantity, 0);
    const checkFreshStockSystem = checkFreshStockArray.reduce((sum, item) => sum += item.checkStockSystem, 0);
    const differenceCheckFreshStock = (checkFreshStock - checkFreshStockSystem).toFixed(1);

    //Query kiểm kho chín
    const checkCookedStockArray = await CookedHistory.find({ action: 'confirmCheckProductStock', checkStockRecord: true, store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean();
    const checkCookedStock = checkCookedStockArray.reduce((sum, item) => sum += item.quantity, 0);
    const checkCookedStockSystem = checkCookedStockArray.reduce((sum, item) => sum += item.checkStockSystem, 0);
    const differenceCheckCookedStock = (checkCookedStock - checkCookedStockSystem).toFixed(1);
    const store = await Store.findById(storeId);

    return res.status(200).json({ store: store.name, beginFreshInventory, endFreshInventory, beginCookedInventory, endCookedInventory, mainStockExport, weighedMainStockExport, soldHistory, reImportCooked, grill, cooked, reImportFresh, differenceCheckFreshStock: differenceCheckFreshStock === "NaN" ? "Không có data" : differenceCheckFreshStock, differenceCheckCookedStock: differenceCheckCookedStock === "NaN" ? "Không có data" : differenceCheckCookedStock });
  } catch (err) {
    console.log(err);
  }
}

exports.getCheckFreshStockHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { firstTimePick, secondTimePick } = req.body;
    const firstTime = transformLocalDateString(new Date(`${firstTimePick.month}/${firstTimePick.date}/${firstTimePick.year}`));
    const secondTime = transformLocalDateString(new Date(`${secondTimePick.month}/${secondTimePick.date}/${secondTimePick.year}`));
    const startShiftFirstTime = new Date(`${firstTime}, 09:00 PM`).getTime() - 86400000;
    const endShiftSecondTime = new Date(`${secondTime}, 09:00 PM`).getTime();
    const checkFreshStockArray = await FreshHistory.find({ action: 'confirmCheckFreshStock', checkStockRecord: true, store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
    return res.status(200).json(checkFreshStockArray)
  } catch (error) {
    console.log(error);
  }
}

exports.getCheckProductStockHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { firstTimePick, secondTimePick } = req.body;
    const firstTime = transformLocalDateString(new Date(`${firstTimePick.month}/${firstTimePick.date}/${firstTimePick.year}`));
    const secondTime = transformLocalDateString(new Date(`${secondTimePick.month}/${secondTimePick.date}/${secondTimePick.year}`));
    const startShiftFirstTime = new Date(`${firstTime}, 09:00 PM`).getTime() - 86400000;
    const endShiftSecondTime = new Date(`${secondTime}, 09:00 PM`).getTime();
    const checkCookedStockArray = await CookedHistory.find({ action: 'confirmCheckProductStock', checkStockRecord: true, store: new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().sort({ _id: -1 }).populate('user').populate({ path: 'confirmCheckStock', populate: 'user' });
    return res.status(200).json(checkCookedStockArray)
  } catch (error) {
    console.log(error);
  }
}
