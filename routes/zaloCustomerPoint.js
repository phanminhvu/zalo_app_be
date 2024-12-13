const express = require('express')
const { addZaloHistoryPoint, getHistoryPoints } = require('./../controllers/zaloCustomerPoint')
const isAuth = require('../middleware/isAuth')

const router = express.Router()

router.post('/customer/zalo-customer-add-history-point', addZaloHistoryPoint)
router.get('/customer/get-history-points', getHistoryPoints)

module.exports = router
