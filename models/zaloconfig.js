const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
  value: {
    type: String,
    required: true,
  }
})

module.exports = mongoose.model('ZaloConfig', userSchema)
