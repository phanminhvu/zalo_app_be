const express = require("express");
const isAuth = require("../middleware/isAuth");
const canManageShippingService = require("../middleware/canManageShippingService");
const canManageShippingServiceOrder = require("../middleware/canManageShippingServiceOrder");
const { createShippingService, deleteShippingService, getAllShippingServices, getAllProducingOrders } = require("../controllers/shippingService");



const router = express.Router();

//CRUD SHIPPING SERVICE
router.get('/shipping-services', isAuth, getAllShippingServices);
router.post('/create-shipping-service', canManageShippingService, createShippingService);
router.delete('/delete-shipping-service', canManageShippingService, deleteShippingService);

//MANAGE SHIPPING SERVICE ORDER
router.get('/producing-orders/:storeId', canManageShippingServiceOrder, getAllProducingOrders);

module.exports = router;