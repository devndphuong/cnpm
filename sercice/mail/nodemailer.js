const nodemailer = require("nodemailer");
require("dotenv").config();

const mailName = process.env.MAIL_USER;
const mailPassword = process.env.MAIL_PASSWORD;

// Tạo transporter để kết nối tới dịch vụ email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: mailName,
    pass: mailPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendMailBill = async (data) => {
  const mailOptions = {
    from: mailName, // Thay thế bằng email của bạn
    to: data.to,
    subject: "Thông tin đơn hàng",
    html: `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h2 {
            color: #2e3d49;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            color: #888;
            margin-top: 20px;
          }
          .button {
            display: inline-block;
            color: #ffffff;
            background-color: #007BFF;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
          }
          .button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Thông Tin Đơn Hàng</h2>
          <p>Xin chào <strong>${data.name}</strong>,</p>
          <p>Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi. Dưới đây là thông tin chi tiết về đơn hàng của bạn:</p>
          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="font-weight: bold;">Mã đơn hàng:</td>
              <td>${data.codeBill}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Tên khách hàng:</td>
              <td>${data.name}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Chi tiết đơn hàng:</td>
              <td><a href="${data.linkDetail}" class="button" target="_blank">Xem Chi Tiết</a></td>
            </tr>
          </table>
          <div class="footer">
            <p>Chúng tôi sẽ cập nhật bạn về trạng thái đơn hàng sớm nhất.</p>
            <p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>
          </div>
        </div>
      </body>
    </html>
  `,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error occurred: " + error.message);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Response:", info.response);
  });
};
module.exports = {
  sendMailBill,
};
