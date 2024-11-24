const express = require("express");
const isAuth = require("../middleware/isAuth");
const { getNotification, updateTokenDevice, testNotification} = require("../controllers/notification");

const router = express.Router();

router.get('/notification', isAuth, getNotification);

router.put('/notification/token-device', isAuth, updateTokenDevice);

router.post('/notification/test/send', testNotification);

module.exports = router;