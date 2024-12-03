const express = require("express");
const { addProduct, editProduct, deleteProduct, addManyProducts, deleteManyProducts, changeProductStatus, getAllProducts } = require("../controllers/zaloProducts");

const router = express.Router();

router.post('/customer/zaloproducts', addProduct);
router.put('/customer/zaloproducts/:id', editProduct);
router.delete('/customer/zaloproducts/:id', deleteProduct);
router.post('/customer/zaloproducts/many', addManyProducts);
router.delete('/customer/zaloproducts/many', deleteManyProducts);
router.put('/customer/zaloproducts/status/:id', changeProductStatus);
router.get('/customer/zaloproducts', getAllProducts);

module.exports = router;
