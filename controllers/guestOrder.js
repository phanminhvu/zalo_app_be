const GuestOrder = require('../models/guestOrder');

// Add a new guest order
exports.addGuestOrder = async (req, res) => {
  try {
    const guestOrder = new GuestOrder(req.body);
    await guestOrder.save();
    res.status(201).json(guestOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error adding guest order', error });
  }
};

// Edit an existing guest order
exports.editGuestOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const guestOrder = await GuestOrder.findByIdAndUpdate(id, req.body, { new: true });
    if (!guestOrder) {
      return res.status(404).json({ message: 'Guest order not found' });
    }
    res.status(200).json(guestOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error editing guest order', error });
  }
};

// Delete a guest order
exports.deleteGuestOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const guestOrder = await GuestOrder.findByIdAndDelete(id);
    if (!guestOrder) {
      return res.status(404).json({ message: 'Guest order not found' });
    }
    res.status(200).json({ message: 'Guest order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting guest order', error });
  }
};

// List guest orders with pagination
exports.listGuestOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const guestOrders = await GuestOrder.find()
        .skip((page - 1) * limit)
        .limit(Number(limit));
    const total = await GuestOrder.countDocuments();
    res.status(200).json({ total, guestOrders });
  } catch (error) {
    res.status(500).json({ message: 'Error listing guest orders', error });
  }
};


// Add many guest orders
exports.addManyGuestOrders = async (req, res) => {
  try {
    const guestOrders = await GuestOrder.insertMany(req.body);
    res.status(201).json(guestOrders);
  } catch (error) {
    res.status(500).json({ message: 'Error adding guest orders', error });
  }
};

// Delete many guest orders
exports.deleteManyGuestOrders = async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await GuestOrder.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: 'Guest orders deleted successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting guest orders', error });
  }
};
