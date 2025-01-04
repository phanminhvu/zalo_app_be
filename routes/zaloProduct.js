const express = require("express");
const { addProduct, editProduct, deleteProduct, addManyProducts, deleteManyProducts, changeProductStatus, getAllProducts } = require("../controllers/zaloProducts");
const isAuth = require("../middleware/isAuth");
const { uploadDisk } = require("../utils/multer.js")

const router = express.Router();

router.post('/customer/zaloproducts', isAuth, uploadDisk.single('uploadImage'), addProduct);
router.put('/customer/zaloproducts/:id', isAuth, uploadDisk.single('uploadImage'), editProduct);
router.delete('/customer/zaloproducts/:id', isAuth, deleteProduct);
router.post('/customer/zaloproducts/many', isAuth, addManyProducts);
router.delete('/customer/zaloproducts/many', isAuth,deleteManyProducts);
router.put('/customer/zaloproducts/status/:id', isAuth, changeProductStatus);
router.get('/customer/zaloproducts', getAllProducts);

module.exports = router;
