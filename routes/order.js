const express = require("express");
const isAuth = require("../middleware/isAuth");
const canTransferStore = require("../middleware/canTransferStore");
const canConfirmSellExport = require("../middleware/canConfirmSellExport");
const canManageShippingServiceOrder = require("../middleware/canManageShippingServiceOrder.js");
const canUpdateOrder = require("../middleware/canUpdateOrder.js")
const { getOrders, postEndProduceOrder, postStartShipOrder, postEndShipOrder, getCreateOrder, getProduceOrder, getShipOrder, getOrdersQuantity, getSuccessOrder, getTodayOrders, getOrdersWeight, postStartProduceOrderHttp, confirmQuickOrderHttp, transferStore, handleShippingService, undoShippingService, getStartShippingServiceOrders, startShippingServiceOrders, getEndShippingServiceOrders, endShippingServiceOrders, handleShippingFee, updateShippingFee, postCreateOrderHttp, updateOrder, postCreateTimerOrder, getOrdersAdmin, getOrdersWeightAndQuantity } = require("../controllers/order");
const { uploadDisk } = require("../utils/multer.js")

const router = express.Router();

router.get('/orders', isAuth, getOrders);
router.get('/orders-admin/:storeId', isAuth, getOrdersAdmin);
router.get('/orders/quantity', isAuth, getOrdersQuantity);
router.get('/orders/weight', isAuth, getOrdersWeight);
router.get('/orders/create', isAuth, getCreateOrder);
router.get('/orders/create/today', isAuth, getTodayOrders);
router.get('/orders/total', isAuth, getOrdersWeightAndQuantity);
router.get('/orders/produce', isAuth, getProduceOrder);
router.get('/orders/start-shipping-service', isAuth, getStartShippingServiceOrders);
router.get('/orders/end-shipping-service', isAuth, getEndShippingServiceOrders);
router.get('/orders/ship', isAuth, getShipOrder);
router.get('/orders/success', isAuth, getSuccessOrder);
router.put('/order/transfer', canTransferStore, transferStore);
router.post('/order/create', isAuth, uploadDisk.single('image'), postCreateOrderHttp);
router.post('/order/create-timer', isAuth, uploadDisk.single('image'), postCreateTimerOrder);
router.put('/order/update', canUpdateOrder, uploadDisk.single('image'), updateOrder);
router.post('/order/start-produce', canConfirmSellExport, postStartProduceOrderHttp);
router.post('/order/confirm-success-quick-order', canConfirmSellExport, confirmQuickOrderHttp);
router.post('/order/end-produce', isAuth, postEndProduceOrder);
router.post('/order/start-ship', isAuth, postStartShipOrder);
router.post('/order/end-ship', isAuth, postEndShipOrder);
router.put('/order/handle-shipping-fee', canManageShippingServiceOrder, handleShippingFee);
router.put('/order/update-shipping-fee', canManageShippingServiceOrder, updateShippingFee);
router.put('/order/handle-shipping-service', canManageShippingServiceOrder, handleShippingService);
router.put('/order/undo-shipping-service', canManageShippingServiceOrder, undoShippingService);
router.put('/orders/start-shipping-service', canManageShippingServiceOrder, startShippingServiceOrders);
router.put('/orders/end-shipping-service', canManageShippingServiceOrder, endShippingServiceOrders);

module.exports = router;