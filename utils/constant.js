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


exports.products = [
    {
        "name": "Combo 1kg",
        "image": "https://quequan.vn:8081/images/products/Combo 1kg.jpg",
        "category_id": 1,
        "price": 550000,
        "sale_price": 450000,
        "on_sale": 1,
        "description": " - Combo 1kg: Bao gồm 1kg nem nướng, 800g bún tươi, 800g nước chấm, 200g bánh giòn, 200g bánh tráng cuốn. Ngoài ra còn có:  đồ chua, xoài, dưa leo, ớt satế, xà lách và 4 loại rau thơm đủ dùng.- 1kg nem nướng có khoảng 20 que nem. Trước khi ăn, quý khách nhớ cắt dọc làm 2 hoặc 4. Như vậy sẽ đủ dùng cho khoảng 7 -8 người ăn. ",
        "related_products": [],
        "weight": 1
    },
    {
        "name": "Combo 0.7kg",
        "image": "https://quequan.vn:8081/images/products/Combo 0.7kg.jpg",
        "category_id": 1,
        "price": 400000,
        "sale_price": 350000,
        "on_sale": 1,
        "description": "- Combo 0,7kg: Bao gồm 0.7 kg nem nướng, 550g bún tươi, 550g nước chấm, 150g bánh giòn, 150g bánh tráng cuốn. Ngoài ra còn có:  đồ chua, xoài, dưa leo, ớt satế, xà lách và 4 loại rau thơm đủ dùng. - 0.7 kg nem nướng có khoảng 14 que nem. Trước khi ăn, quý khách nhớ cắt dọc làm 2 hoặc 4. Như vậy sẽ đủ dùng cho khoảng 5 người ăn.",
        "related_products": [],
        "weight": 0.7
    },
    {
        "name": "Combo 0.5kg",
        "image": "https://quequan.vn:8081/images/products/Combo 0.5kg.jpg",
        "category_id": 1,
        "price": 290000,
        "sale_price": 240000,
        "on_sale": 1,
        "description": "- Combo 0,5kg: Bao gồm 0.5kg nem nướng, 400g bún tươi, 400g nước chấm, 100g bánh giòn, 100g bánh tráng cuốn. Ngoài ra còn có:  đồ chua, xoài, dưa leo, ớt satế, xà lách và 4 loại rau thơm đủ dùng. - 0.5kg nem nướng có khoảng 10 que nem. Trước khi ăn, quý khách nhớ cắt dọc làm 2 hoặc 4. Như vậy sẽ đủ dùng cho khoảng 3 - 4 người ăn. ",
        "related_products": [],
        "weight": 0.5
    },
    {
        "name": "Nem Không 500g",
        "image": "https://quequan.vn:8081/images/products/Nem Không 500g.jpg",
        "category_id": 1,
        "price": 180000,
        "sale_price": 150000,
        "on_sale": 1,
        "description": "CHỈ CÓ khoảng 10 que nem chín đóng trong bọc giữ nhiệt. KHÔNG BAO GỐM: bánh giòn, bánh tráng cuốn, nước chấm, rau dưa, đồ chua…",
        "related_products": [],
        "weight": 0.5
    },
    {
        "name": "Phần 1 người",
        "image": "https://quequan.vn:8081/images/products/Phan 1 nguoi.jpg",
        "category_id": 1,
        "price": 80000,
        "sale_price": 0,
        "on_sale": 0,
        "description": "Combo 1 người - Bao gồm: - 100g nem nướng. - Món ăn kèm: bún tươi, nước chấm, bánh giòn, bánh tráng cuốn, đồ chua, xoài, dưa leo, ớt satế, xà lách và 3 loại rau thơm đủ dùng. - Có thể cuốn khoảng 8 cuốn, tất cả để trong 1 khay nhựa. ",
        "related_products": [],
        "weight": 0.1
    },
    {
        "name": "Phần 2 người",
        "image": "https://quequan.vn:8081/images/products/Phan 2 nguoi.jpg",
        "category_id": 1,
        "price": 155000,
        "sale_price": 0,
        "on_sale": 0,
        "description": "Combo 2 người - Bao gồm: - 200g nem nướng. - Món ăn kèm: bún tươi, nước chấm, bánh giòn, bánh tráng cuốn, đồ chua, xoài, dưa leo, ớt satế, xà lách và 3 loại rau thơm đủ dùng. - Có thể cuốn khoảng 16 cuốn, tất cả để trong 1 khay nhựa. ",
        "related_products": [],
        "weight": 0.2
    },
    {
        "name": "Nem sống 500g",
        "image": "https://quequan.vn:8081/images/products/Nem Song.jpg",
        "category_id": 2,
        "price": 125000,
        "sale_price": 0,
        "on_sale": 0,
        "description": "Nem sống chưa nướng, được bảo quản đông đá. Trước khi nướng, cần phải xả đông.",
        "related_products": [],
        "weight": 0.5
    },
    {
        "name": "Chè dừa Vani",
        "image": "https://quequan.vn:8081/images/products/Che dua vani.jpg",
        "category_id": 3,
        "price": 30000,
        "sale_price": 25000,
        "on_sale": 1,
        "description": "Bao gồm: Thạch Dừa, Trân châu, Hạt đác, Thạch sợi giòn, Khúc Bạch, Nước cốt Chè… đủ dùng cho 1 người. ",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Chè dừa Café",
        "image": "https://quequan.vn:8081/images/products/Che dua caphe.jpg",
        "category_id": 3,
        "price": 30000,
        "sale_price": 25000,
        "on_sale": 1,
        "description": "Bao gồm: Thạch Dừa, Trân châu, Hạt đác, Thạch sợi giòn, Khúc Bạch, Nước cốt Chè, Cà phê… đủ dùng cho 1 người. ",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Bánh giòn 100g",
        "image": "https://quequan.vn:8081/images/products/Banhgion100g.jpg",
        "category_id": 3,
        "price": 40000,
        "sale_price": 30000,
        "on_sale": 1,
        "description": "Bánh tráng ngọt được cuốn tròn và chiên giòn. Phần 100g đang dùng cho phần Combo 0.5kg nem.",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Nước chấm 400g",
        "image": "https://quequan.vn:8081/images/products/Nuoc cham 400g.jpg",
        "category_id": 3,
        "price": 40000,
        "sale_price": 30000,
        "on_sale": 1,
        "description": "Nước chấm đậu phụng và thịt nạc xay. Phần 400g đang dùng cho phần Combo 0.5kg nem.",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Dưa xoài, đồ chua",
        "image": "https://quequan.vn:8081/images/products/Dua xoai.jpg",
        "category_id": 3,
        "price": 30000,
        "sale_price": 25000,
        "on_sale": 1,
        "description": "Gồm dưa, xoài, đồ chua (cà rốt, củ đậu). Phần này đang dùng cho phần Combo 0.5kg nem.",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Rau các loại",
        "image": "https://quequan.vn:8081/images/products/Rau cac loai.jpg",
        "category_id": 3,
        "price": 30000,
        "sale_price": 25000,
        "on_sale": 1,
        "description": "Gồm xà lách, tía tô, quế, diếp cá, hẹ. Phần rau đang dùng cho phần Combo 0.5kg nem.",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Bánh Tráng cuốn 100g ",
        "image": "https://quequan.vn:8081/images/products/Banh trang cuon 100g.jpg",
        "category_id": 3,
        "price": 15000,
        "sale_price": 10000,
        "on_sale": 1,
        "description": "Bánh tráng cuốn Tây Ninh. Phần này đang dùng cho phần Combo 0.5kg nem.",
        "related_products": [],
        "weight": 0
    },
    {
        "name": "Bún 0.5kg ",
        "image": "https://quequan.vn:8081/images/products/Bun tuoi 0.5kg.jpg",
        "category_id": 3,
        "price": 15000,
        "sale_price": 10000,
        "on_sale": 1,
        "description": "Bún tươi sợi nhỏ.",
        "related_products": [],
        "weight": 0
    }
]
;
