const User = require("../models/user");
const Role = require("../models/role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ message: errors.array()[0].msg });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('store');
    if (!user) {
      return res.status(422).json({ message: "Sai email hoặc mật khẩu!" });
    }

    const doMatchPassword = await bcrypt.compare(password, user.password);
    if (doMatchPassword) {
      const role = await Role.findById(user.role);
      const token = jwt.sign(
        { email, userId: user._id?.toString(), role: role.name, store: user.store, permission: role.permission },
        process.env.JWT_SECRET
      );

      user.accessToken = token;
      await user.save();

      return res.status(200).json({
        message: "Đăng nhập thành công!",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          store: user.store?._id,
          storeName: user.store?.name,
          role: role.name,
          roleDescription: role.description,
          permission: role.permission,
          photo: user.photo,
          accessToken: token,
        },
      });
    } else if (user.resetPassword) {
      const doMatchResetPassword = await bcrypt.compare(password, user.resetPassword);
      if (doMatchResetPassword) {
        const role = await Role.findById(user.role);
        const token = jwt.sign(
          { email, userId: user._id?.toString(), role: role.name, store: user.store, permission: role.permission },
          process.env.JWT_SECRET
        );

        user.accessToken = token;
        user.password = user.resetPassword;
        user.resetPassword = undefined;
        await user.save();

        return res.status(200).json({
          message: "Đăng nhập thành công!",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            store: user.store?._id,
            storeName: user.store?.name,
            role: role.name,
            roleDescription: role.description,
            permission: role.permission,
            photo: user.photo,
            accessToken: token,
          },
        });
      }
    }
    else {
      return res.status(422).json({ message: "Sai email hoặc mật khẩu!" });
    }
  } catch (err) {
    console.log(err);
  }
};
