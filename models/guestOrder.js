const mongoose = require('mongoose');
const {Types} = require("mongoose");
const Schema = mongoose.Schema;

const shippingSchema = new Schema({
  id: Number,
  name: String,
  phone: String,
  address: String,
  notes: String,
  default: Boolean,
  lng: Number,
  lat: Number
});

const storeSchema = new Schema({
  id: Number,
  district: Number,
  province: Number,
  name: String,
  address: String,
  lat: Number,
  lng: Number,
  urlApi: String
});

const shippingDateSchema = new Schema({
  date: String,
  hour: Number,
  minute: Number
});

const lineItemSchema = new Schema({
  id: Number,
  parent: Number,
  name: String,
  quantity: Number,
  subtotal: Number,
  price: Number,
  image: String,
  user_note: String,
  weight: Number
});

const guestOrderSchema = new Schema({
  parent_id: Number,
  status: String,
  currency: String,
  version: String,
  total_item: Number,
  prices_include_tax: Boolean,
  date_created: String,
  date_modified: String,
  discount_total: Number,
  discount_tax: String,
  shipping_total: Number,
  total: Number,
  customer_id: String,
  customer_name: String,
  customer_phone: String,
  shipping: shippingSchema,
  payment_method: String,
  payment_method_title: String,
  created_via: String,
  date_completed: String,
  branch_id: Number,
  branch_type: Number,
  storeId: String,
  cua_hang: [storeSchema],
  shippingDate: shippingDateSchema,
  line_items: [lineItemSchema],
  note: String,
  source: String,
  store: {
    type: Types.ObjectId,
    ref: 'Store'
  },
  createdAt: {
    type: String,
    required: true
  },
  id_order: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('GuestOrder', guestOrderSchema)
