const Order = require('../models/order');
const io = require("../socket");

exports.postCreateTag = async (data) => {
  const { tagArray, orderId, store, serviceIndex } = data;
  try {
    const order = await Order.findById(orderId).populate({ path: 'creator', populate: 'user' }).populate({ path: 'producer', populate: 'user' }).populate({ path: 'shipper', populate: 'user' }).populate({ path: 'transferStore', populate: ['fromStore', 'user'] });

    if (order) {
      order.tag = tagArray
      await order.save();
    }
    io.getIO().emit(`add-tag-${store}`, order);
    if (order.shippingService.serviceName) {
      io.getIO().emit(`add-tag-start-shipping-service-order-${store}`, { order, serviceIndex });
      io.getIO().emit(`add-tag-end-shipping-service-order-${store}`, { order, serviceIndex });
    }

  } catch (err) {
    console.log(err);
  }
}