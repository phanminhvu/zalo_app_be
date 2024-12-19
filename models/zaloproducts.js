const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    category_id: {
        type: Number,
    },
    price: {
        type: Number
    },
    sale_price: {
        type: Number,
    },
    on_sale: {
        type:Number,
    },
    description: {
        type: String,
    },
    // notes: [{
    //     content: { type: String },
    //     color: { type: String }
    // }
    // ],
    weight: {
        type: Number
    },
    status: {
        type: Boolean
    }
});

module.exports = mongoose.model("ZaloProducts", userSchema);
