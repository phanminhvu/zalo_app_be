const { Types } = require("mongoose");
const Product = require("../models/product");
const User = require("../models/user");
const MainStock = require("../models/mainStock");
const SubStock = require("../models/subStock");
const FreshHistory = require("../models/freshHistory");
const Store = require("../models/store");
const Order = require("../models/order");
const { domain } = require("../utils/constant");
const { transformLocalDateString, transformLocalDateTimeString, checkShiftTime, generateCode } = require("../utils/getTime");

const getBalanceByStorePending = async function (store) {
  try {
    const allExportProducts = await Product.find({ action: 'export', "request.store": store });
    const exportQuantity = allExportProducts.filter(prod => prod.request.status === "pending" || prod.request.status === "approved" || prod.request.status === "confirm").reduce((sum, prod) => sum += prod.quantity, 0);
    return exportQuantity.toFixed(1);
  }
  catch (err) {
    console.log(err);
  }
}

exports.importStock = async (req, res) => {
  const { quantity, note } = req.body;
  try {
    const mainStock = await MainStock.findById('64ae1029c59e9a218183feee');
    if ((mainStock.inventory + +quantity) > mainStock.maxCapacity) {
      return res.json({ message: `Không thể nhập vượt quá sức chứa ${mainStock.maxCapacity}kg` })
    }

    const user = await User.findById(req.user.userId);
    const product = new Product({ action: 'import', quantity, note, timeStamp: transformLocalDateTimeString(new Date()), timeStampHistory: Date.now(), user });
    await product.save();
    product.balance = mainStock.inventory + +quantity;
    await product.save();

    mainStock.inventory = product.balance;
    await mainStock.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getInventory = async (req, res) => {
  try {
    const mainStock = await MainStock.findById('64ae1029c59e9a218183feee');
    return res.status(200).json(mainStock.inventory);
  } catch (err) {
    console.log(err);
  }
}

exports.getInventoryByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const allExportProductsByStore = await Product.find({ action: 'export', "request.store": new Types.ObjectId(storeId), "request.status": 'complete' });
    const exportQuantity = allExportProductsByStore.reduce((sum, prod) => sum += prod.quantity, 0);
    return res.status(200).json(exportQuantity);
  } catch (err) {
    console.log(err);
  }
}

exports.getImportExportHistory = async (req, res) => {
  try {
    const allProducts = await Product.find().populate({ path: 'request', populate: 'store user' }).lean().populate('user').sort({ timeStampHistory: -1 });
    return res.status(200).json(allProducts);
  } catch (err) {
    console.log(err);
  }
}

exports.getImportExportBillByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);
    const allProducts = await Product.find({ "request.store": new Types.ObjectId(storeId) }).lean().populate('user').populate({ path: 'request', populate: 'store user' }).sort({ timeStampHistory: -1 });
    return res.status(200).json({ store, data: allProducts });
  } catch (err) {
    console.log(err);
  }
}

exports.getImportExportHistoryByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const allProducts = await Product.find({ "request.store": new Types.ObjectId(storeId) }).lean().populate('user').populate({ path: 'request', populate: 'store user' }).sort({ timeStampHistory: -1 });
    return res.status(200).json(allProducts);
  } catch (err) {
    console.log(err);
  }
}

exports.getImportExportHistoryByStoreByDate = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { firstTimePick, secondTimePick } = req.body;
    const firstTime = transformLocalDateString(new Date(`${firstTimePick.month}/${firstTimePick.date}/${firstTimePick.year}`));
    const secondTime = transformLocalDateString(new Date(`${secondTimePick.month}/${secondTimePick.date}/${secondTimePick.year}`));
    const startShiftFirstTime = new Date(`${firstTime}, 09:00 PM`).getTime() - 86400000;
    const endShiftSecondTime = new Date(`${secondTime}, 09:00 PM`).getTime();
    const allProducts = await Product.find({ "request.store": new Types.ObjectId(storeId), timeStampHistory: { $gt: startShiftFirstTime, $lt: endShiftSecondTime } }).lean().populate('user').populate({ path: 'request', populate: 'store user' }).sort({ timeStampHistory: -1 });
    return res.status(200).json(allProducts);
  } catch (err) {
    console.log(err);
  }
}

exports.postRequestStockByStore = async (req, res) => {
  const { storeId } = req.params;
  try {

    const findStore = await Product.findOne({ "request.store": storeId, "request.status": { $nin: ["complete"] } });
    if (findStore) {
      return res.json({ message: "Tồn tại yêu cầu đang xử lý" });
    }
    const user = await User.findById(req.user.userId);
    const product = new Product({
      action: 'export',
      request: {
        store: new Types.ObjectId(storeId),
        status: 'pending',
        timeStamp: transformLocalDateTimeString(new Date()),
        timeStampHistory: Date.now(),
        user
      },
    });
    await product.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getAllRequestStock = async (req, res) => {
  try {
    const requestStock = await Product.find({ action: 'export', 'request.status': { $nin: 'complete' } }).lean().populate({ path: 'request', populate: 'store user' });
    return res.status(200).json(requestStock);
  }
  catch (err) {
    console.log(err);
  }
}

exports.getRequestStockByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const requestStock = await Product.find({ action: 'export', 'request.status': { $nin: 'complete' }, "request.store": new Types.ObjectId(storeId) }).lean().populate({ path: 'request', populate: 'store user' });
    return res.status(200).json(requestStock);
  }
  catch (err) {
    console.log(err);
  }
}

exports.approveRequest = async (req, res) => {
  const { id, quantity, note, unitPrice } = req.body;
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const user = await User.findById(req.user.userId);
    const request = await Product.findById(id);
    const mainStock = await MainStock.findById('64ae1029c59e9a218183feee');
    if (request.quantity > mainStock.inventory) {
      return res.json({ message: 'Tồn kho không đủ số lượng!' })
    } else {
      request.request.status = 'approved';
      request.unitPrice = +unitPrice;
      request.timeStamp = transformLocalDateTimeString(new Date());
      request.user = user;
      request.quantity = quantity;
      request.note = note;
      request.deliveryReceiptPicture = imageUrl;
      request.timeStampHistory = Date.now();
      await request.save();
      request.balance = mainStock.inventory - request.quantity;
      await request.save();
      mainStock.inventory = request.balance;
      await mainStock.save();
      return res.end();
    }
  } catch (err) {
    console.log(err);
  }
}

exports.deleteRequest = async (req, res) => {
  const { id } = req.body;
  try {
    await Product.findByIdAndDelete(id);
    return res.end();
  }
  catch (err) {
    console.log(err);
  }
}

exports.deleteRequestFromStore = async (req, res) => {
  const { id } = req.body;
  try {
    const request = await Product.findById(id);
    if (request.request.status !== 'pending') {
      return res.json({ message: 'Yêu cầu đã được xử lý' });
    }
    await Product.findByIdAndDelete(id);
    return res.end();
  }
  catch (err) {
    console.log(err);
  }
}

exports.confirmRequest = async (req, res) => {
  const { id } = req.body;
  try {
    const request = await Product.findById(id);
    request.request.status = 'confirm';
    await request.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getBillDetail = async (req, res) => {
  try {
    const { billCode } = req.params;
    const billDetail = await Product.find({ billCode }).lean().populate({ path: 'request', populate: 'store' });
    return res.json(billDetail)
  } catch (error) {
    console.log(error);
  }
}

exports.cancelBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    await Product.updateOne({ _id: orderId }, { $set: { payment: 'unbill' }, $unset: { billCode: 1 } })
    return res.end();
  } catch (error) {
    console.log(error);
  }
}

exports.saveBill = async (req, res) => {
  try {
    const { billCode } = req.params;
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    await Product.updateMany({ billCode }, { payment: 'paid', paymentPicture: imageUrl });

    return res.json({ message: 'Xác nhận hóa đơn thành công' });
  } catch (error) {
    console.log(error);
  }
}

exports.getBillList = async (req, res) => {
  try {
    const { storeId } = req.params;
    const billList = [];
    const products = await Product.find({ "request.store": storeId }).lean().populate({ path: 'request', populate: 'store' }).sort({ timeStampHistory: -1 });
    products.forEach(item => {
      if (item.billCode) {
        const findBillCode = billList.findIndex(_item => _item.billCode === item.billCode);
        if (findBillCode === -1) {
          billList.push(item);
        }
      }
    })
    return res.json(billList);
  } catch (error) {

  }
}

exports.billingOrder = async (req, res) => {
  try {
    const { detail, billCode } = req.body;
    const billTimeStamp = transformLocalDateTimeString(new Date());
    const billTimeStampHistory = Date.now()
    let flag = true;
    while (flag) {
      const checkCode = await Product.findOne({ billCode });
      if (!checkCode) {
        flag = false;
      } else {
        const newBillCode = generateCode();
        detail.forEach(async order => {
          await Product.updateOne({ _id: order._id }, {
            $set: {
              payment: "billed", billCode: newBillCode, billTimeStamp,
              billTimeStampHistory
            }
          });
        });
      }
    }
    detail.forEach(async order => {
      await Product.updateOne({ _id: order._id }, {
        $set: {
          payment: "billed", billCode, billTimeStamp,
          billTimeStampHistory
        }
      });
    })
    return res.json({ message: "Tạo hóa đơn thành công" })
  } catch (error) {
    console.log(error);
  }
}

exports.completeRequest = async (req, res) => {
  try {
    const imageUrl = [];
    if (req.files) {
      req.files.forEach(file => {
        const formatPath = domain + file.path.replace("\\", "/");
        imageUrl.push(formatPath);
      })
    }
    const { storeId } = req.params;
    const { id, quantity, confirmMultiPicture } = req.body;
    const request = await Product.findById(id);
    const subStock = await SubStock.findOne({ store: new Types.ObjectId(request.request.store) });
    const findPendingFreshHistory = await FreshHistory.findOne({ store: new Types.ObjectId(storeId), action: 'checkFreshStock' });
    if (findPendingFreshHistory) {
      return res.json({ message: 'Đang chờ xác nhận kiểm kho sống' })
    }

    request.request.quantity = +quantity;
    request.request.status = 'complete';
    request.request.confirmMultiPicture = imageUrl;
    request.balanceStore = subStock.freshInventory + +quantity;
    request.payment = "unbill";
    await request.save();

    const checkShift = checkShiftTime();
    const shiftDay = checkShift.shiftDay;
    const shiftCode = checkShift.morningShift ? 'S' : 'C';
    const freshHistory = new FreshHistory({
      action: 'importFromMainStock',
      freshBalance: subStock.freshInventory + +quantity,
      store: new Types.ObjectId(storeId),
      user: request.request.user,
      quantity,
      shiftDay,
      shiftCode,
      timeStamp: transformLocalDateTimeString(new Date()),
      timeStampHistory: Date.now(),
      importFreshPhoto: imageUrl
    });
    await freshHistory.save();


    await SubStock.updateOne({ store: request.request.store }, { $set: { freshInventory: freshHistory.freshBalance } });
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.forecastStock = async (req, res) => {
  try {
    const shiftDay = checkShiftTime().shiftDay;
    const oneDayBefore = new Date();
    oneDayBefore.setDate(new Date(shiftDay).getDate() - 1);
    const twoDaysBefore = new Date();
    twoDaysBefore.setDate(new Date(shiftDay).getDate() - 2);
    const threeDaysBefore = new Date();
    threeDaysBefore.setDate(new Date(shiftDay).getDate() - 3);

    const dayOne = transformLocalDateString(oneDayBefore);
    const dayTwo = transformLocalDateString(twoDaysBefore);
    const dayThree = transformLocalDateString(threeDaysBefore);
    const today = transformLocalDateString(new Date(shiftDay));

    const allStores = await Store.find().lean();

    const forecastStock = await Promise.all(allStores.map(async store => {
      const subStock = await SubStock.findOne({ store }).lean();
      const ordersTodayMorning = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], shiftDay: today, store, shiftCode: 'S' }).lean();
      const ordersTodayAfternoon = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], shiftDay: today, store, shiftCode: 'C' }).lean();
      const ordersDayOne = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], shiftDay: dayOne, store }).lean();
      const ordersDayTwo = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], shiftDay: dayTwo, store }).lean();
      const ordersDayThree = await Order.find({ $nor: [{ status: ['confirm-delete-produce', 'confirm-delete-ship', 'confirm-delete-success', 'transfer'] }], shiftDay: dayThree, store }).lean();

      const quantityDayOne = ordersDayOne.reduce((sum, order) => sum += order.quantity, 0);
      const quantityDayTwo = ordersDayTwo.reduce((sum, order) => sum += order.quantity, 0);
      const quantityDayThree = ordersDayThree.reduce((sum, order) => sum += order.quantity, 0);

      const quantityTodayMorning = ordersTodayMorning.reduce((sum, order) => sum += order.quantity, 0);
      const quantityTodayAfternoon = ordersTodayAfternoon.reduce((sum, order) => sum += order.quantity, 0);

      const averageQuantityPerDay = (quantityDayOne + quantityDayTwo + quantityDayThree) / 3;


      return ({ store, quantityTodayMorning, quantityTodayAfternoon, averageQuantityPerDay, freshInventory: subStock?.freshInventory, cookedInventory: subStock?.cookedInventory });
    }))
    return res.json(forecastStock);
  } catch (err) {
    console.log(err);
  }
}