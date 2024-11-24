const User = require("../../models/user");
const Role = require('../../models/role');

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({ name: { $nin: ['admin', "director"] } });
    return res.json(roles);
  } catch (err) {
    console.log(err);
  }
};

exports.getUsers = async (req, res) => {
  const { storeId } = req.params;
  try {
    const users = await User.find({ role: { $nin: ["643ce869e6c312b8c449e26f", "643eaa0fd418d1fe9aefd4a7"] }, store: storeId }).populate('role').populate('store');
    const usersResponse = users.map((user) => {
      return { id: user._id, email: user.email, name: user.name, role: user.role, store: user.store, photo: user.photo }
    })
    return res.json(usersResponse);
  } catch (err) {
    console.log(err);
  }
}


