const Action = require('../../models/action');

exports.getActions = async (req, res) => {
  try {
    const actions = await Action.find();
    return res.json(actions);
  } catch (err) {
    console.log(err)
  }
}