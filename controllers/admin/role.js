const Role = require('../../models/role');

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    return res.json(roles);
  } catch (err) {
    console.log(err);
  }
};

exports.getRoleById = async (req, res, next) => {
  const { roleId } = req.body;
  try {
    const roles = await Role.findById(roleId);
    return res.json(roles);

  } catch (err) {
    console.log(err);
  }
};

exports.postRole = async (req, res, next) => {
  const { name, permission, permissionVN, description } = (req.body);
  try {
    const newRole = new Role({ name, permission, permissionVN, description });
    await newRole.save();
    return res.status(200).json({ message: 'Tạo phân quyền thành công!' })

  } catch (err) {
    console.log(err);
  }
};

exports.editRole = async (req, res, next) => {
  const { permission, permissionVN } = req.body;
  const { roleId } = req.params;
  try {
    const role = await Role.findById(roleId);
    role.permission = permission;
    role.permissionVN = permissionVN;
    await role.save();
    return res.json({ message: 'Cập nhật quyền hạn thành công' });
  } catch (err) {
    console.log(err);
  }
}

exports.deleteRoleById = async (req, res, next) => {
  const { roleId } = req.body;
  try {
    await Role.findByIdAndDelete(roleId);
    return res.status(200).json({ message: 'Xóa phân quyền thành công' });
  } catch (err) {
    console.log(err);
  }
};