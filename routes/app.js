const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// Sử dụng bodyParser để lấy dữ liệu từ form
app.use(bodyParser.urlencoded({ extended: true }));

// Route để hiển thị trang form
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/main.handlebars");
});

// Route để xử lý yêu cầu POST từ form
app.post("/subscribe", (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  // Đoạn mã để xử lý địa chỉ email và tên người dùng ở đây
  res.send(`Cảm ơn ${username} đã đăng ký với địa chỉ email ${email}!`);
});

// Khởi động server
const port = 3000;
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
