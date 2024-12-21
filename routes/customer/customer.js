const {
	getAllStores,
	postOrderById,
	getCustomerData,
	getStoreById,
	postGetphoneNumber,
	createMacCheckout,
	createOrder,
	getOrderbyUserid,
  postZaloCustomer,
	getZaloReferralCode,
	postActiveZaloReferralCode,
	getZaloCustomerPoint,
	getOrderDetail,
} = require('../../controllers/customer/customer')

const router = require('express').Router()

router.get('/customer/stores', getAllStores)
router.get('/customer/store/:storeId', getStoreById)
router.get('/customer/data', getCustomerData)
router.post('/customer/order', postOrderById)
router.post('/customer/phonenumber', postGetphoneNumber)
router.post('/customer/createmaccheckout', createMacCheckout)
router.post('/customer/createorder', createOrder)
router.get('/customer/listorder', getOrderbyUserid)
router.get('/customer/order-detail', getOrderDetail)
router.post('/customer/zalocustomer', postZaloCustomer)
router.get('/customer/zalo-referral-code', getZaloReferralCode)
router.post('/customer/active-zalo-referral-code', postActiveZaloReferralCode)
router.get('/customer/zalo-customer-point', getZaloCustomerPoint)

module.exports = router
