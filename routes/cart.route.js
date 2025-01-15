const express = require("express");
const { add } = require("../utils/database");
const db = require("../utils/database");
require("dotenv").config();
const { default: axios } = require("axios");
const crypto = require("crypto");
const { sendMailBill } = require("../sercice/mail/nodemailer");
require("dotenv").config();

var accessKey = process.env.ACCESS_KEY;
var secretKey = process.env.SECRET_KEY;

const router = express.Router();

// xem giỏ hàng
router.get("/", async function (req, res) {
  var sessionId = req.signedCookies.sessionId; // id người dùng
  if (!sessionId) {
    return res.redirect("/");
  } else {
    const product = await db.load(
      "SELECT p.productID, p.productName, p.productPrice, c.size, c.quantity, (p.productPrice*c.quantity) as total, pm.main FROM products p, customer_product c, productimages pm WHERE c.productId = p.productID and c.productId = pm.productID AND c.customerID = " +
        sessionId
    );
    //const image = await db.load('select main from productimages where productID = ' + sessionId);
    const maxOrder = await db.load(
      "select count(*) as count from orders where customerID = " + sessionId
    );
    //console.log(image);
    //product[0].main = image[0].main;
    // xem còn order được nữa không? mỗi khách chỉ được tạo tối đa 2 đơn 1 ngày!
    var isOrder = true;
    if (maxOrder[0].count >= 3) {
      isOrder = false;
    }
    var sum = 0;
    for (var i = 0; i < product.length; i++) {
      sum += product[i].total;
    }
    return res.render("cart", {
      categories: product,
      sum,
      isOrder,
    });
  }
});

// xóa bớt sản phẩm khỏi giỏ hàng
router.get("/delete", async function (req, res) {
  const customID = req.signedCookies.sessionId;
  const id = req.query.id;
  const size = req.query.size;
  if (!customID) {
    return res.redirect("/");
  } else {
    await db.deleteProductInCart("customer_product", customID, id, size);
    //await db.load('delete from customer_product where productId = ' + id + ' and size = ' + size);
    res.redirect("/cart");
  }
});

// gửi đơn hàng đi
router.post("/payment", async function (req, res) {
  // lấy id, tên, đchi, số đt, ghi chú.
  var sessionId = req.signedCookies.sessionId;
  var name = req.body.name;
  var address = req.body.address;
  var phone = req.body.phone;
  var email = req.body.email;
  var note = req.body.note;
  var paymentMethod = req.body.paymentMethod;

  if (!sessionId) {
    return res.redirect("/");
  } else {
    if (!note) {
      note = "Không";
    }
    var paymentStatus = paymentMethod === "cash" ? null : "PENDING";
    // tạo random 1 mã đơn hàng
    var orderNumber = Math.floor(Math.random() * 100000000) + 10000000;
    while (true) {
      const rows = await db.load(
        "select count(*) as count from orders where orderNumber = " +
          orderNumber
      );
      if (rows[0].count == 0) {
        break;
      }
      orderNumber = Math.floor(Math.random() * 100000000) + 10000000;
    }

    // lấy ra các sản phẩm khách để trong giỏ
    const product = await db.load(
      "SELECT products.productID, products.productPrice, customer_product.size, customer_product.quantity, (products.productPrice*customer_product.quantity) as total FROM products, customer_product WHERE customer_product.productId = products.productID AND customer_product.customerID = " +
        sessionId
    );
    var sum = 0;
    for (var i = 0; i < product.length; i++) {
      sum += product[i].total;
    }
    var dataPayUrl = await createBillUrl(sum);

    await db.load(
      "insert into orders values(" +
        orderNumber +
        ", " +
        sessionId +
        ", '" +
        name +
        "', '" +
        phone +
        "', '" +
        email +
        "', '" +
        address +
        "',NOW(), '" +
        note +
        "', 'Đang xử lý', '" +
        paymentMethod +
        "', '" +
        paymentStatus +
        "', '" +
        dataPayUrl.orderId +
        "', '" +
        dataPayUrl.payUrl +
        "')"
    );

    sendMailBill({
      name: name,
      to: email,
      codeBill: orderNumber,
      linkDetail: process.env.REDIRECT_URL + "/bill/detail/" + orderNumber,
    });

    await db.load("SET FOREIGN_KEY_CHECKS = 0");
    // đưa sản phẩm khách để trong giỏ vào chi tiết đơn hàng
    for (var i = 0; i < product.length; i++) {
      await db.load(
        "insert into orderdetails values (" +
          orderNumber +
          "," +
          product[i].productID +
          "," +
          product[i].quantity +
          "," +
          product[i].productPrice +
          ", " +
          product[i].size +
          ")"
      );
    }
    await db.load("SET FOREIGN_KEY_CHECKS = 1");
    // xóa hết dữ liệu trong giỏ hàng
    await db.load(
      "delete from customer_product where customerID = " + sessionId
    );

    // chuyển hướng tùy thuộc vào phương thức thanh toán
    if (paymentMethod !== "cash") {
      return res.redirect(dataPayUrl.payUrl);
    } else {
      return res.redirect("/");
    }
  }
});

// Tạo đường dẫn thanh toán
const createBillUrl = async (amount) => {
  //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
  //parameters

  var redirectUrl = process.env.REDIRECT_URL;
  var ipnUrl = process.env.IPN_URL;
  var orderInfo = "Thanh toán đơn hàng";
  var partnerCode = "MOMO";
  var requestType = "payWithMethod";

  var orderId = partnerCode + new Date().getTime(); // Mã đơn hàng duy nhất, kết hợp mã đối tác và timestamp để đảm bảo không trùng lặp.
  var requestId = orderId;
  var extraData = "";
  //   var paymentCode =
  //     "T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==";
  var orderGroupId = "";
  var autoCapture = true;
  var lang = "vi";

  //before sign HMAC SHA256 with format
  //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
  var rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;
  //puts raw signature
  console.log("--------------------RAW SIGNATURE----------------");
  //   console.log(rawSignature);
  //signature
  var signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  //   console.log("--------------------SIGNATURE----------------");
  //   console.log(signature);

  //json object send to MoMo endpoint
  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });

  // option for axios
  const options = {
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
    data: requestBody,
  };

  let result;
  try {
    result = await axios(options);
    return result.data;
  } catch (error) {
    result = {
      resultCode: 500,
      message: "Server error!",
    };
    return result;
  }
};

module.exports = router;
