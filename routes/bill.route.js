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

router.get("/detail/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;
  const orderDetail = await db.loadSingle(
    "select * from orders where orderNumber = '" + orderNumber + "'"
  );

  if (!orderDetail) {
    return res.redirect("/");
  }
  const order_list = await db.load(
    "select o.productID, o.orderNumber, o.quantity, o.priceEach, p.productID,o.size, p.productName,(o.quantity * o.priceEach) as total, pm.main from orderdetails as o, products as p, productimages as pm where orderNumber = " +
      orderNumber +
      " and o.productID = p.productID and pm.productID = o.productID"
  );
  var sum = 0;
  for (var i = 0; i < order_list.length; i++) {
    sum += order_list[i].total;
  }

  return res.render("billDetail", {
    title: "",
    orderDetail: orderDetail,
    orderList: order_list,
    totalAmount: sum,
  });
});

// Tạo link thanh toán
router.get("/listBill", async (req, res) => {
  const { email } = req.params;
  console.log(email);

  const rows = await db.load(
    "select * from orders where email = '" + email + "'"
  );
  if (!rows) {
    return res.render("listBill", {
      rows: rows,
      email: email,
      empty: true,
    });
  }
  return res.render("listBill", {
    rows: rows,
    email: email,
  });
});

// Tạo link thanh toán
router.post("/listBill", async (req, res) => {
  const { email } = req.body;
  console.log(email);

  const rows = await db.load(
    "select * from orders where email = '" + email + "'"
  );
  if (!rows) {
    return res.render("listBill", {
      rows: rows,
      email: email,
      empty: true,
    });
  }
  return res.render("listBill", {
    rows: rows,
    email: "",
  });
});

module.exports = router;
