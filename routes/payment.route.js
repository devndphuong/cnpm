const express = require("express");
const bcrypt = require("bcryptjs");
const { default: axios } = require("axios");
const crypto = require("crypto");
const db = require("../utils/database");

const {
  createBillUrl,
  callbackStatusBill,
} = require("../controllers/bill.controller");
require("dotenv").config();

const router = express.Router();

// Tạo link thanh toán
router.post("/payment", createBillUrl);

// Call back thanh toán
router.post("/callback", callbackStatusBill);

// Kiểm tra trạng thái thanh toán
router.post("/transaction-status", callbackStatusBill);

module.exports = router;
