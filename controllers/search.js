const Order = require("../models/order");
const TimerOrder = require("../models/timerOrder");
const Store = require("../models/store");
const DeletedOrder = require("../models/deletedOrder");
const UpdatedOrder = require("../models/updatedOrder");
const User = require("../models/user");
const { checkShiftTime } = require("../utils/getTime");


exports.postSearchAllStores = async (req, res) => {
  const { searchPhone } = req.params;
  const shiftDay = checkShiftTime().shiftDay;

  try {
    const ordersAllStores = await Order.find({ shiftDay }).maxTimeMS(10000).lean().populate('store').populate({
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
      });
    let ordersSearchResult = [];
    ordersAllStores.forEach(order => {
      order?.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          ordersSearchResult.push(order)
        }
      })
      if (order?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        const foundOrder = ordersSearchResult.find(item => item._id === order._id);
        if (!foundOrder) ordersSearchResult.push(order);
      }
    });

    const timerOrdersAllStores = await TimerOrder.find({ status: 'pending' }).maxTimeMS(10000).lean();
    const timerOrdersSearchResult = await Promise.all(timerOrdersAllStores.map(async order => {
      const store = await Store.findById(order.createOrderData.store);
      let timerOrders;
      order.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          timerOrders = order;
        }
      })
      if (order.createOrderData?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        timerOrders = order;
      }
      return { store: store?.name, timerOrders, id: order._id }
    }))

    const deletedOrdersAllStores = await DeletedOrder.find({ "orderData.shiftDay": shiftDay }).maxTimeMS(10000).lean();
    const deletedOrdersSearchResult = await Promise.all(deletedOrdersAllStores.map(async order => {
      const store = await Store.findById(order.store);
      let deletedOrders;
      order.orderData?.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          deletedOrders = order;
        }
      })
      if (order.orderData?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        deletedOrders = order;
      }
      return { store: store?.name, deletedOrders, id: order._id }
    }))

    return res.status(200).json({ orders: ordersSearchResult.reverse(), timerOrders: timerOrdersSearchResult.filter(order => order.timerOrders).reverse(), deletedOrders: deletedOrdersSearchResult.filter(order => order.deletedOrders).reverse() })
  } catch (err) {
    console.log(err);
  }
}

exports.postSearchByStore = async (req, res) => {
  const { searchPhone } = req.params;
  const { store } = req.user;
  const shiftDay = checkShiftTime().shiftDay;

  try {
    const ordersByStore = await Order.find({ store, shiftDay }).maxTimeMS(10000).lean().populate('store').populate({
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
      });
    let ordersSearchResult = [];
    ordersByStore.forEach(order => {
      order?.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          ordersSearchResult.push(order)
        }
      })
      if (order?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        const foundOrder = ordersSearchResult.find(item => item._id === order._id);
        if (!foundOrder) ordersSearchResult.push(order);
      }
    });

    let timerOrdersSearchResult = [];

    const timerOrdersByStore = await TimerOrder.find({ "createOrderData.store": store._id, status: 'pending' }).maxTimeMS(10000).lean();
    timerOrdersByStore.forEach(order => {
      order?.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          timerOrdersSearchResult.push({ timerOrders: order, id: order._id })
        }
      })
      if (order.createOrderData?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        const foundOrder = timerOrdersSearchResult.find(item => item.id === order._id);
        if (!foundOrder) timerOrdersSearchResult.push({ timerOrders: order, id: order._id })
      }
    })


    let deletedOrdersSearchResult = [];
    const deletedOrdersByStore = await DeletedOrder.find({ store: store._id, "orderData.shiftDay": shiftDay }).maxTimeMS(10000).lean();
    deletedOrdersByStore.forEach(order => {
      order.orderData?.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          deletedOrdersSearchResult.push({ deletedOrders: order, id: order._id })
        }
      })
      if (order.orderData?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        const foundOrder = deletedOrdersSearchResult.find(item => item.id === order._id);
        if (!foundOrder) deletedOrdersSearchResult.push({ deletedOrders: order, id: order._id })
      }
    })
    return res.status(200).json({ orders: ordersSearchResult.reverse(), timerOrders: timerOrdersSearchResult.reverse(), deletedOrders: deletedOrdersSearchResult.reverse() })
  } catch (err) {
    console.log(err);
  }
}

exports.postSearchPersonal = async (req, res) => {
  const { searchPhone } = req.params;
  const { store, userId } = req.user;
  const shiftDay = checkShiftTime().shiftDay;

  try {
    const ordersByStore = await Order.find({ store, shiftDay }).lean().populate({
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
      });;
    const ordersPersonal = ordersByStore.filter(order => order.creator.user?.toString() === userId || order.producer.user?.toString() === userId || order.shipper.user?.toString() === userId || order.confirmShip.user?.toString() === userId);
    let ordersSearchResult = [];
    ordersPersonal.forEach(order => {
      order.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          ordersSearchResult.push(order)
        }
      })
      if (order?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        const foundOrder = ordersSearchResult.find(item => item._id === order._id);
        if (!foundOrder) ordersSearchResult.push(order);
      }
    });

    let timerOrdersSearchResult = [];

    const timerOrdersByStore = await TimerOrder.find({ "createOrderData.store": store._id, status: 'pending' }).lean();
    const timerOrdersPersonal = timerOrdersByStore.filter(order => order.createOrderData.creator.id === userId);
    timerOrdersPersonal.forEach(order => {
      order.phone.forEach(phone => {
        if (phone.includes(searchPhone) && searchPhone.trim() !== "") {
          timerOrdersSearchResult.push({ timerOrders: order, id: order._id })
        }
      })
      if (order.createOrderData?.detail.toLowerCase().includes(searchPhone.toLowerCase()) && searchPhone.trim() !== "") {
        const foundOrder = timerOrdersSearchResult.find(item => item.id === order._id);
        if (!foundOrder) timerOrdersSearchResult.push({ timerOrders: order, id: order._id })
      }
    })

    return res.status(200).json({ orders: ordersSearchResult.reverse(), timerOrders: timerOrdersSearchResult.reverse() });
  } catch (err) {
    console.log(err);
  }
}

exports.getSearchDetail = async (req, res) => {
  const { orderId } = req.params;
  try {
    const orderDetail = await Order.findById(orderId).lean().populate('store').populate({
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
      });

    const updatedOrderDetail = await UpdatedOrder.find({ originalId: orderId }).lean().populate('editor');
    return res.status(200).json({ orderDetail, updatedOrderDetail });
  } catch (err) {
    console.log(err);
  }
}

exports.getTimerOrdersSearchDetail = async (req, res) => {
  const { orderId } = req.params;
  try {
    const orderDetail = await TimerOrder.findById(orderId).lean()
    return res.status(200).json(orderDetail);
  } catch (err) {
    console.log(err);
  }
}

exports.getDeletedOrdersSearchDetail = async (req, res) => {
  const { orderId } = req.params;
  try {
    const orderDetail = await DeletedOrder.findById(orderId).lean().populate('deletor');
    const creator = await User.findById(orderDetail.orderData.creator?.user).lean();
    const producer = await User.findById(orderDetail.orderData.producer?.user).lean();
    const shipper = await User.findById(orderDetail.orderData.shipper?.user).lean();
    return res.status(200).json({ orderDetail, creator, producer, shipper }).lean();
  } catch (err) {
    console.log(err);
  }
}