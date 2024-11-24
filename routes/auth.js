const express = require("express");
const { postLogin } = require("../controllers/auth");

const router = express.Router();

router.post(
  "/login",
  postLogin
);


module.exports = router;
