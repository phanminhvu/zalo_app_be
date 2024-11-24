const ShippingService = require('../models/shippingService');
const Order = require("../models/order");
const { Types } = require('mongoose');

exports.getAllShippingServices = async (req, res) => {
  try {
    const allShippingService = await ShippingService.find({ store: req.user.store });
    return res.status(200).json(allShippingService);
  } catch (err) {
    console.log(err);
  }
}

exports.createShippingService = async (req, res) => {
  const { name } = req.body;
  try {
    const findDuplicateName = await ShippingService.findOne({ name: { $regex: new RegExp(name, "i") }, store: req.user.store });
    if (findDuplicateName) {
      return res.json({ message: 'Đơn vị giao hàng đã tồn tại' });
    }
    const newShippingService = new ShippingService({
      name,
      store: req.user.store
    });
    await newShippingService.save();
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.deleteShippingService = async (req, res) => {
  const { id } = req.body;
  try {
    await ShippingService.findByIdAndDelete(id);
    return res.end();
  } catch (err) {
    console.log(err);
  }
}

exports.getAllProducingOrders = async (req, res) => {
  const { storeId } = req.params;
  try {
    const allProducingOrders = await Order.find({ status: "produce", "producer.produceEnd": undefined, shippingService: undefined, store: new Types.ObjectId(storeId) }).populate({
      path: "producer",
      populate: "user",
    })
    return res.status(200).json(allProducingOrders);
  } catch (err) {
    console.log(err);
  }
}