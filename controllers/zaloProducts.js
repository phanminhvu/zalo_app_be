const ZaloProducts = require('../models/zaloproducts');

// Add a single product
exports.addProduct = async (req, res) => {
  try {
    const newProduct = new ZaloProducts(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error adding product', error: err });
  }
};

// Edit a product
exports.editProduct = async (req, res) => {
  try {
    // const updatedProduct = await ZaloProducts.findByIdAndUpdate(req.params.id, req.body, { new: true });
    const updatedProduct = await ZaloProducts.findOneAndUpdate({id: req.params.id}, req.body, {new: true})
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error editing product', error: err });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await ZaloProducts.findOneAndRemove({id: req.params.id});
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err });
  }
};

// Add many products
exports.addManyProducts = async (req, res) => {
  try {
    const newProducts = await ZaloProducts.insertMany(req.body);
    res.status(201).json(newProducts);
  } catch (err) {
    res.status(500).json({ message: 'Error adding products', error: err });
  }
};

// Delete many products
exports.deleteManyProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await ZaloProducts.deleteMany({ id: { $in: ids } });
    res.status(200).json({ message: `${result.deletedCount} products deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting products', error: err });
  }
};

exports.changeProductStatus = async (req, res) => {
  try {
    const product = await ZaloProducts.findOne({id: req.params.id});
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.status = !product.status;
    await product.save();
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error changing product status', error: err });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await ZaloProducts.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving products', error: err });
  }
};
