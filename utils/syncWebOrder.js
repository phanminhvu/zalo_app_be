const WebOrder = require('../models/webOrder');
const API_TOKEN = '0FB581B509ED3E1980DFB952171B803AE3261E8B5E772D1F38638EE2506D8C7B'
const axios = require('axios');
const Store = require('../models/store');
const Customer = require("../models/customer");
const GuestOrder = require("../models/guestOrder");
const {transformLocalDateString, transformLocalTimeString} = require("./getTime");
const io = require("../socket");

const mapOrderToGuestOrder = (order) => {
    return {
        parent_id: order.id || null,
        status: order.order_processing_status || "pending",
        currency: order.currency || "VND",
        total_item: order.line_items ? order.line_items.length : 0,
        prices_include_tax: order.taxes_included || false,
        date_created: order.created_at || new Date().toISOString(),
        date_modified: order.updated_at || new Date().toISOString(),
        discount_total: order.total_discounts || 0,
        discount_tax: 0, // Not provided explicitly
        shipping_total: order.shipping_lines?.reduce((sum, ship) => sum + (ship.price || 0), 0) || 0,
        total: order.total_price || 0,
        customer_id: order.customer?.id || null,
        customer_name: order.customer?.name || "",
        customer_phone: order.customer?.phone || "",
        shipping: {
            id: order.shipping_address?.id || null,
            name: order.shipping_address?.name || "",
            phone: order.shipping_address?.phone || "",
            address: order.shipping_address?.address1 || "",
            notes: "",
            default: order.shipping_address?.default || false,
            lng: order.shipping_address?.longitude || 0,
            lat: order.shipping_address?.latitude || 0,
        },
        payment_method: order.gateway_code || "",
        payment_method_title: order.gateway || "",
        created_via: "web",
        date_completed: order.confirmed_at || null,
        branch_id: order.location_id || null,
        branch_type: order.location_name || null,
        storeId: null, // Assuming no storeId provided
        cua_hang: [], // Assuming no explicit store data in this structure
        shippingDate: {
            date: order.note_attributes?.find(attr => attr.name === "Delivery Time")?.value?.split(" ")[0] || null,
            hour: order.note_attributes?.find(attr => attr.name === "Delivery Time")?.value?.split(" ")[1]?.split(":")[0] || 0,
            minute: order.note_attributes?.find(attr => attr.name === "Delivery Time")?.value?.split(" ")[1]?.split(":")[1] || 0,
        },
        line_items: order.line_items.map(item => ({
            id: item.id || null,
            parent: item.product_id || null,
            name: item.name || "",
            quantity: item.quantity || 1,
            subtotal: item.price || 0,
            price: item.price || 0,
            image: item.image?.src || "",
            user_note: "",
            weight: item.grams || 0
        })),
        note: order.note || "",
        source: order.source || "web",
        store: null, // Assuming no store reference
        createdAt: new Date().toISOString(),
        id_order: order.name || ""
    };
};


const sendWebOrder = async (order) => {
    const store = await Store.findOne({
        name: String(order.location_name).toUpperCase()
    })

    const data = mapOrderToGuestOrder(order);

    // const name = `${order.billing_address && order.billing_address.last_name ? order.billing_address.last_name : ''} ${order.billing_address && order.billing_address.first_name ? order.billing_address.first_name : ''}`;
    //
    // const productInfo = `CODE: ${order.order_number}, ` + order.line_items.map(item => ` ${item.quantity}P ${item.title}`).join(',');
    //
    // const quantity = 0;
    //
    // const address = `${order.billing_address.address1}, ${order.billing_address.ward}, ${order.billing_address.district}, ${order.billing_address.province}`;
    //
    // const phone = order.billing_address.phone;
    //
    // const payment = order.gateway_code === "COD" ? 'cash' : 'transfer';
    //
    // const bill = order.total_price;
    //
    // const note = `Web - ${order.note ? order.note : ''}`;
    //
    // const createdAt = transformLocalDateString(new Date()) +
    //     " - " +
    //     transformLocalTimeString(new Date());
    try {
        const guestOrder = new GuestOrder(data)

        await guestOrder.save();

        const guestOrdersByStore = await GuestOrder.find({store});
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
            .sort({"order.created_at": -1})
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
        } else {
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
    } catch (err) {
        console.log("Error: ", err)
    }
    console.log("Sync Web Order end");
}

module.exports = syncWebOrder;
