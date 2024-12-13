const zalocustomer = require('../models/zalocustomer')
const ZaloHistoryPoint = require('./../models/zalohistorypoint')
const ZaloOrder = require('./../models/zaloorder')

// Add a single product
exports.addZaloHistoryPoint = async (req, res) => {
	const orderId = req.query.orderId
	try {
		const order = await ZaloOrder.findOne({ orderId })
		const orderDetail = order.order
		if (orderDetail) {
			const time = orderDetail?.date_created
			const customerId = orderDetail?.customer_id
			const total = orderDetail?.total_item
			const commission = global.COMMISSION_RATE * total
			const name = orderDetail?.cua_hang?.[0]?.name
			console.log(orderId, time, customerId, total, commission, name, global.COMMISSION_RATE)
			const newHistory = new ZaloHistoryPoint({
				idOrder: orderId,
				customerId,
				name,
				time,
				value: commission,
			})
			await newHistory.save()
      const customer = await zalocustomer.findOne({id: customerId})
      if (!customer) {
        res.status(400).json({ message: 'Không tìm thấy đơn hàng' })
        return
      }
      if (customer.point) customer.point += commission
      else customer.point = commission
      await customer.save()

			res.status(200).json({ message: 'Thêm tích điểm thành công' })
			return
		}

		res.status(400).json({ message: 'Không tìm thấy đơn hàng' })
	} catch (err) {
		res.status(500).json({ message: 'Lỗi khi thêm tích điểm', error: err })
	}
}

exports.getHistoryPoints = async (req, res) => {
  const userId = req.query.userId
	const data = await ZaloHistoryPoint.find({customerId: userId})

	if (data) {
		return res.status(200).json({
			data: data.reverse(),
		})
	}
	return res.status(400).json({ error: 'Không thể lấy thông tin tích điểm' })
}
