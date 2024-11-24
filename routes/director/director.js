const express = require("express");
const isDirectorAuth = require("../../middleware/isDirector");
const { getUsers, getRoles } = require("../../controllers/director/director");
const router = express.Router();


router.get('/director/user/store/:storeId', isDirectorAuth, getUsers);
router.get('/director/roles', isDirectorAuth, getRoles);

module.exports = router;