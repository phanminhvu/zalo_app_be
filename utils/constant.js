const { title } = require("process");

exports.domain = "https://quequan.vn:8081/"
// exports.domain = "http://localhost:8081/"


exports.notification = {
    common: {
        title: "Quế Quân",
    },
    create: {
        title: "Tạo đơn hàng thành công",
        content: "",
        status: "1"
    },
    produce: {
        title: "Đơn hàng đã được xác nhận",
        content: "",
        status: "2"
    },
    ship: {
        title: "Đơn hàng đang được vận chuyển",
        content: "",
        status: "3"
    },
    success: {
        title: "Đơn hàng đã giao thành công",
        content: "",
        status: "4"
    },
};
