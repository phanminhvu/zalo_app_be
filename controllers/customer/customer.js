const Store = require('../../models/store')
const GuestOrder = require('../../models/guestOrder')
const Customer = require('../../models/customer')
const ZaloOrder = require('../../models/zaloorder')
const ZaloCustomer = require('../../models/zalocustomer')
const io = require('../../socket')
const { Types } = require('mongoose')
const axios = require('axios')

const CryptoJS = require('crypto-js')

const { transformLocalDateString, transformLocalTimeString } = require('../../utils/getTime')

exports.postOrderById = async (req, res) => {
	const { storeId, orderData } = req.body
	const { name, address, phone, quantity, note, payment, bill, productInfo } = orderData
	const toNumberBill = Number(bill)
	try {
		const findPhone = await Customer.findOne({ phone })
		if (!findPhone) {
			const newCustomer = new Customer({ name, address, phone })
			await newCustomer.save()
		}
		const allStores = await Store.find()
		const checkStoreIndex = allStores.findIndex((store) => store._id.toString() === storeId)
		if (checkStoreIndex === -1) {
			return res.status(400).json('Đường dẫn đặt hàng không tồn tại!')
		}
		const store = await Store.findById(storeId)
		const createdAt =
			transformLocalDateString(new Date()) + ' - ' + transformLocalTimeString(new Date())
		const guestOrder = new GuestOrder({
			createdAt,
			store,
			app: false,
			name,
			productInfo,
			address,
			phone: String(phone),
			quantity,
			note,
			payment,
			bill: toNumberBill,
		})
		await guestOrder.save()
		const guestOrdersByStore = await GuestOrder.find({ store })
		store.guestOrders = guestOrdersByStore.length
		await store.save()
		const allGuestOrders = await GuestOrder.find()
		io.getIO().emit(`get-guest-orders-quantity-${store._id}`, guestOrdersByStore.length)
		io.getIO().emit('get-all-guest-orders-quantity', allGuestOrders.length)
		return res.status(200).json('Đặt hàng thành công!')
	} catch (err) {
		console.log(err)
	}
}

exports.getAllStores = async (req, res) => {
	try {
		const stores = await Store.find()
		const storesRes = stores.map((store) => {
			return { name: store.name, slug: store.slug }
		})
		return res.status(200).json(storesRes)
	} catch (err) {
		console.log(err)
	}
}

exports.getStoreById = async (req, res) => {
	const { storeId } = req.params
	try {
		if (storeId.match(/^[0-9a-fA-F]{24}$/)) {
			const store = await Store.findById(storeId)
			return res.status(200).json(store)
		} else {
			return res.end()
		}
	} catch (err) {
		console.log(err)
	}
}

exports.getCustomerData = async (req, res) => {
	try {
		const customers = await Customer.find()
		const customersRes = customers.map((customer) => {
			return { name: customer.name, address: customer.address, phone: customer.phone }
		})
		return res.status(200).json(customersRes)
	} catch (err) {
		console.log(err)
	}
}

// exports.postGetphoneNumber = async (req, res) => {
//   const { accessToken, token } = req.body; // Nhận accessToken và token từ yêu cầu
//   console.log("Received data from client:", { accessToken, token });
//   const secretKey = "LzdSCNlgSw6D47WUC1Mm"; // Khóa bí mật của ứng dụng Zalo
//   const endpoint = "https://graph.zalo.me/v2.0/me/info";
//   try {
//     // Gọi API của Zalo để lấy thông tin số điện thoại
//     const userResponse = await axios.get(endpoint, {
//       params: {
//         access_token: accessToken, // Gửi access_token trong tham số
//         code: token, // Sử dụng mã token từ `getPhoneNumber`
//         secret_key: secretKey, // Khóa bí mật của ứng dụng
//       },
//     });

//     console.log("Response Code:", userResponse.status);
//     console.log("Full Response Body:", JSON.stringify(userResponse.data, null, 2));
//     // Lấy số điện thoại từ phản hồi
//     const phoneNumber = userResponse.data?.data?.number;

//     if (!phoneNumber) {
//       console.error("Không tìm thấy số điện thoại trong phản hồi của Zalo:", userResponse.data);
//       return res.status(404).json({ error: "Không tìm thấy số điện thoại trong phản hồi của Zalo." });
//     }

//     console.log("Số điện thoại từ Zalo:", phoneNumber);

//     // Gửi số điện thoại về cho ứng dụng
//     res.json({ phoneNumber });
//   } catch (error) {
//     console.error("Lỗi khi gọi API của Zalo:", error);
//     res.status(500).json({
//       error: "Không thể lấy số điện thoại từ Zalo.",
//       details: error.message,
//     });
//   }
// }

exports.postGetphoneNumber = async (req, res) => {
	const { accessToken, token } = req.body // Nhận accessToken và token từ request

	console.log('Access Token received from client:', req.body.accessToken)
	console.log('Token received from client:', token)

	const secretKey = 'LzdSCNlgSw6D47WUC1Mm' // Khóa bí mật của ứng dụng Zalo

	try {
		const resInfo = await axios.get(
			'https://graph.zalo.me/v2.0/me?fields=id,name,picture.type(large),birthday',
			{
				headers: {
					access_token: accessToken,
				},
			},
		)
		const userInfo = resInfo.data
		const id = userInfo?.id

		const response = await axios.get('https://graph.zalo.me/v2.0/me/info', {
			params: {
				access_token: accessToken, // Sử dụng access token từ client
				code: token, // Sử dụng mã token từ client
				secret_key: secretKey, // Khóa bí mật của ứng dụng
			},
		})

		const phoneNumber = response.data?.data?.number
		if (!phoneNumber) {
			return res.status(404).json({ error: 'Không tìm thấy số điện thoại.' })
		}
		if (id) {
			const user = await ZaloCustomer.findOne({ id })
			if (user) {
				user.phone = phoneNumber
				user.save()
			}
		}

		res.json({ phoneNumber })
	} catch (error) {
		console.error('Lỗi khi gọi API của Zalo:', error)
		res.status(500).json({ error: 'Không thể lấy số điện thoại từ Zalo.', details: error.message })
	}
}

exports.createMacCheckout = async (req, res) => {
	try {
		const body = req.body
		console.log(body)
		const dataMac = Object.keys(body)
			.sort() // sắp xếp key của Object data theo thứ tự từ điển tăng dần
			.map(
				(key) => `${key}=${typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]}`,
			) // trả về mảng dữ liệu dạng [{key=value}, ...]
			.join('&') // chuyển về dạng string kèm theo "&", ví dụ: amount={amount}&desc={desc}&extradata={extradata}&item={item}&method={method}
		// mac = HMAC("HmacSHA256", "58a15304449bfa9e3f251b883f4b1294", dataMac);
		console.log(dataMac)
		const mac = CryptoJS.HmacSHA256(dataMac, '58a15304449bfa9e3f251b883f4b1294').toString()
		console.log(mac)
		return res.status(200).json({ mac })
	} catch (e) {
		return res.status(500).json(e.message)
	}
}

const sendOrder = async (order) => {
	const storeId = order.cua_hang[0].urlApi
	// const name = order.customer_name ? order.customer_name : 'No Name'

	const id_order = order.id.split('_')[1]

	// let address = ''
	// if (order.branch_type == 0) {
	// 	address = order.shipping?.address
	// } else {
	// 	address = 'Lấy tại cửa hàng'
	// }

	const phone = order.shipping?.phone ? order.shipping.phone : order.customer_phone

	// let note = `${order.note}\n ${
	// 	order.branch_type == 1 ? 'Lấy tại cửa hàng' : 'Giao hàng tận nơi'
	// }\n `

	// const payment = order.payment_method == 'COD' ? 'cash' : 'transfer'
	// const item = order.line_items
	// let productInfo = `CODE : ${id_order},`
	// let quantity = 0
	// console.log('item', item)
	// item.forEach((element) => {
	// 	productInfo = productInfo + ' ' + element.name + ' x' + element.quantity + ' Phần,\n '
	// 	note = `${note}, ${element.user_note}`
	// 	quantity = quantity + element.weight
	// })
	// const toNumberBill = Number(order.total_item)
	// const shippingDate = order.shippingDate
	// const textShipTime = shippingDate.date
	// 	? `${shippingDate?.hour} : ${shippingDate?.minute} ${shippingDate.date}`
	// 	: 'Giao ngay'
	// productInfo = `${productInfo}${textShipTime},\n Cửa hàng: ${order.cua_hang[0].name},\n Phí giao hàng : ${order.shipping_total}đ `


	try {
		const findPhone = await Customer.findOne({ phone })
		if (!findPhone) {
			// const newCustomer = new Customer({ name, address, phone });
			// await newCustomer.save();
		}
		const allStores = await Store.find()
		const checkStoreIndex = allStores.findIndex((store) => store._id.toString() === storeId)
		if (checkStoreIndex === -1) {
			return res.status(400).json('Đường dẫn đặt hàng không tồn tại!')
		}
		const store = await Store.findById(storeId)
		const createdAt =
			transformLocalDateString(new Date()) + ' - ' + transformLocalTimeString(new Date())

		const guestOrder = new GuestOrder({
			createdAt,
			store: store._id,
			id_order,
			source: 'Zalo',
			...order,

		})
		await guestOrder.save()

		const guestOrdersByStore = await GuestOrder.find({ store })
		store.guestOrders = guestOrdersByStore.length
		await store.save()
		const allGuestOrders = await GuestOrder.find()
		io.getIO().emit(`get-guest-orders-quantity-${store._id}`, guestOrdersByStore.length)
		io.getIO().emit('get-all-guest-orders-quantity', allGuestOrders.length)
	} catch (err) {
		console.log(err)
	}
}

exports.createOrder = async (req, res) => {
	try {
		const body = req.body
		let newOrder = body.order
		const customer_id = newOrder.customer_id
		newOrder.id = body.orderId
		newOrder.customer_id = customer_id
		let order = new ZaloOrder({ order: newOrder, customer_id: customer_id, orderId: body.orderId })
		await order.save()
		sendOrder(newOrder)
		return res.status(200).json('Đặt hàng thành công!')
	} catch (e) {
		return res.status(500).json(e.message)
	}
}

exports.getOrderbyUserid = async (req, res) => {
	const userid = req.query.userid
	const status = req.query.status
	console.log(req.query.userid, status)
	if (status) {
		const orderListbyUser = await ZaloOrder.find({ customer_id: userid, 'order.status': status }).sort({ createdAt: -1 })
		// console.log(orderListbyUser);
		return res.status(200).json(orderListbyUser)
	}
	else {
		const orderListbyUser = await ZaloOrder.find({ customer_id: userid }).sort({ createdAt: -1 })
		// console.log(orderListbyUser);
		return res.status(200).json(orderListbyUser)
	}
}

exports.getOrderDetail = async (req, res) => {
	const orderId = req.query.orderId
	if (orderId) {
		const order = await ZaloOrder.findOne({ orderId })
		// console.log(orderListbyUser);
		if (order) return res.status(200).json({order})
		return res.status(400).json({message: 'Không tìm thấy đơn hàng'})
	}
	else {
		return res.status(400).json({message: 'Không tìm thấy đơn hàng'})
	}
}

exports.postZaloCustomer = async (req, res) => {
	const { accessToken } = req.body // Nhận accessToken và token từ request

	console.log('Access Token received from client:', req.body.accessToken)

	try {
		const res1 = await axios.get(
			'https://graph.zalo.me/v2.0/me?fields=id,name,picture.type(large),birthday',
			{
				headers: {
					access_token: accessToken,
				},
			},
		)

		const userInfo = res1.data
		const name = userInfo?.name
		const id = userInfo?.id
		const photo = userInfo?.picture?.data?.url
		const birthday = userInfo?.birthday

		if (name && id && photo && birthday) {
			const user = await ZaloCustomer.findOne({ id })
			if (user) {
				if (
					user.name !== name ||
					user.photo !== photo ||
					user.birthday !== birthday
				) {
					user.name = name
					user.photo = photo
					user.birthday = birthday
					user.save()
				}
			} else {
				const zaloUser = new ZaloCustomer({ id, name, phone: '', photo, birthday })
				zaloUser.save()
			}
		}

		res.json({ id, name, photo, phone: '', birthday })
	} catch (error) {
		console.error('Lỗi khi gọi API của Zalo:', error)
		res.status(500).json({ error: 'Không thể lấy thông tin từ Zalo.', details: error.message })
	}
}

exports.getZaloReferralCode = async (req, res) => {
	const id = req.query.userid
	const user = await ZaloCustomer.findOne({ id })

	if (user && user.phone) {
		return res.status(200).json({
			code: user.phone,
		})
	}
	return res.status(400).json({ error: 'Không thể lấy mã giới thiệu' })
}

exports.postActiveZaloReferralCode = async (req, res) => {
	const { code, id } = req.body
	const user = await ZaloCustomer.findOne({ id })
	try {
		if (user) {
			if (user.referral) {
				return res.status(400).json({ message: 'Bạn đã kích hoạt với mã giới thiệu khác!' })
			} else {
				user.referral = code
				user.save()
				return res.status(200).json({ message: 'Kích hoạt mã giới thiệu thành công!' })
			}
		}
		return res.status(400).json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại sau!' })
	} catch (error) {
		return res
			.status(400)
			.json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại sau!', detail: error?.message })
	}
}

exports.getZaloCustomerPoint = async (req, res) => {
	const id = req.query.userid
	const user = await ZaloCustomer.findOne({ id })

	if (user) {
		return res.status(200).json({
			point: user?.point ?? 0,
		})
	}
	return res.status(400).json({ error: 'Không thể lấy thông tin tích điểm' })
}
