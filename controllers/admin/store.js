const Store = require('../../models/store');

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    return res.json(stores)

  } catch (err) {
    console.log(err);
  }
}

exports.postSignupStore = async (req, res) => {
  const { name } = req.body;
  try {
    const newStore = new Store({ name });
    await newStore.save();
    return res.status(200).json({ message: "Đăng ký cửa hàng thành công!" });
  } catch (err) {
    console.log(err);
  }
}
