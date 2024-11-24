const WebOrder = require('../models/webOrder');
const API_TOKEN = '0FB581B509ED3E1980DFB952171B803AE3261E8B5E772D1F38638EE2506D8C7B'
const axios = require('axios');
const Store = require('../models/store');
const Customer = require("../models/customer");
const GuestOrder = require("../models/guestOrder");
const { transformLocalDateString, transformLocalTimeString } = require("./getTime");
const io = require("../socket");

const sendWebOrder = async (order) => {
    const store = await Store.findOne({
        name: String(order.location_name).toUpperCase()
    })

    const name = `${order.billing_address && order.billing_address.last_name ? order.billing_address.last_name : ''} ${order.billing_address && order.billing_address.first_name ? order.billing_address.first_name : ''}`;

    const productInfo = `CODE: ${order.order_number}, ` + order.line_items.map(item => ` ${item.quantity}P ${item.title}`).join(',');

    const quantity = 0;

    const address = `${order.billing_address.address1}, ${order.billing_address.ward}, ${order.billing_address.district}, ${order.billing_address.province}`;

    const phone = order.billing_address.phone;

    const payment = order.gateway_code === "COD" ? 'cash' : 'transfer';

    const bill = order.total_price;

    const note = `Web - ${order.note ? order.note : ''}`;

    const createdAt = transformLocalDateString(new Date()) +
        " - " +
        transformLocalTimeString(new Date());
    try {
        const guestOrder = new GuestOrder({
            createdAt,
            store,
            name: name && name.trim() !== '' ? name : "NoName",
            productInfo,
            quantity,
            address: order.billing_address.address1 ? address : 'Nhận tại cửa hàng',
            phone: String(phone),
            payment,
            note,
            bill: Number(bill)
        })

        await guestOrder.save();

        const guestOrdersByStore = await GuestOrder.find({ store });
        store.guestOrders = guestOrdersByStore.length;
        await store.save();
        const allGuestOrders = await GuestOrder.find();
        io.getIO().emit(`get-guest-orders-quantity-${store._id}`, guestOrdersByStore.length);
        io.getIO().emit("get-all-guest-orders-quantity", allGuestOrders.length);
    } catch (err) {
        console.log('Error: ', err);
    }
}

const syncWebOrder = async () => {
    console.log("Sync Web Order start");
    try {
        const lastesOrder = await WebOrder.findOne({})
            .sort({ "order.created_at": -1 })
            .exec()

        const response = await axios.get('https://apis.haravan.com/com/orders.json?order=created_at%20desc', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            }
        });
        const listOrders = response.data.orders
        let listNewOrders = [];


        if (!lastesOrder) {
            listNewOrders = listOrders;
        }
        else {
            const latestOrderCreatedAt = new Date(lastesOrder.createdAt);
            listNewOrders = listOrders.filter((order) => {
                const orderCreatedAt = new Date(order.created_at);
                return orderCreatedAt > latestOrderCreatedAt;
            })
        }

        for (let order of listNewOrders) {
            const created = new Date(order.created_at);
            const newOrder = new WebOrder({
                order: order,
                orderId: order.order_number,
                createdAt: created
            });
            await newOrder.save();
            // send order 

            await sendWebOrder(newOrder.order);

        }
    }
    catch (err) {
        console.log("Error: ", err)
    }
    console.log("Sync Web Order end");
}

module.exports = syncWebOrder;