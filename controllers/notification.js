const Notification = require("../models/notification");
const User = require('../models/user');
const NotificationService = require('./../services/notification')

exports.getNotification = async (req, res, next) => {
  try {
    const allNotifications = await Notification.find();
    return res.json(allNotifications.reverse());
  } catch (err) {
    console.log(err);
  }
};

exports.updateTokenDevice = async (req, res) => {
  const { userId, tokenDevice } = req.body;
  try {
    const user = await User.findById(userId);
    user.tokenDevice = tokenDevice;
    await user.save();
    res.status(200).json({
      message: 'Cập nhật thông tin thành công!', user: {
        id: user._id,
        store: user.store?._id,
        tokenDevice: user.tokenDevice,
      },
    })
  }
  catch (err) {
    console.log(err);
  }
};

exports.testNotification = async (req, res, next) => {
  const { tokenDevice, title, content, status } = req.body;
  try {
    await NotificationService.test(tokenDevice, title, content, status);

    res.status(200).json({
      message: 'Thông báo đang được xử lý.'
    })
    next();
  } catch (err) {
    console.log(err);
  }
};
