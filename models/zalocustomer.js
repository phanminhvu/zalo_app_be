const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
  phone: {
    type: String
  },
	photo: {
		type: String,
	},
	birthday: {
		type: String,
	},
  accessToken: {
		type: String,
	},
	referral: {
		type: String
	},
	point: {
		type: Number
	}
})

module.exports = mongoose.model('ZaloCustomer', userSchema)
