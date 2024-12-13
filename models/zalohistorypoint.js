const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  idOrder: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
  time: {
		type: String,
		required: true,
	},
  customerId: {
		type: String,
		required: true,
	},
  value: {
    type: Number,
    required: true,
  },
})

module.exports = mongoose.model('ZaloHistoryPoint', userSchema)
