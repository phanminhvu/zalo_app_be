const User = require("../../models/user");

exports.getUsers = async (req, res) => {
  const { storeId } = req.params;
  try {
    const users = await User.find({ store: storeId }).populate('role').populate('store');
    const usersResponse = users.map((user) => {
      return { id: user._id, email: user.email, name: user.name, role: user.role, store: user.store, photo: user.photo }
    })
    return res.json(usersResponse);

  } catch (err) {
    console.log(err);
  }
}

exports.getAdminAccount = async (req, res) => {
  try {
    let users;
    if (req.user.role === "admin") {
      users = await User.find({ role: ['643ce869e6c312b8c449e26f', '643cef2e162c633b558c08cd'] }).populate('role').populate('store');
    } else if (req.user.role === "director") {
      users = await User.find({ role: '643cef2e162c633b558c08cd' }).populate('role').populate('store');
    }
    const usersResponse = users.map((user) => {
      return { id: user._id, email: user.email, name: user.name, role: user.role, store: user.store, photo: user.photo }
    })
    return res.json(usersResponse);
  } catch (err) {
    console.log(err);
  }
}