const express = require("express");
const numeral = require("numeral");
const { engine } = require("express-handlebars");
var express_handlebars_sections = require("express-handlebars-sections");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const appMiddleware = require("./middleware/app.middleware");
const loginMiddleware = require("./middleware/login.middleware");

const app = express();

app.use(express.json());
// lay du lieu tu form gui ve
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      //secure: true
    },
  })
);

app.engine(
  "handlebars",
  engine({
    helpers: {
      section: express_handlebars_sections(),
      format_number: function (value) {
        return numeral(value).format("0,0");
      },
      format_date: function (value) {
        const date = new Date(value);
        if (isNaN(date)) return "Ngày không hợp lệ";

        const options = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        };

        const formattedDate = new Intl.DateTimeFormat("vi-VN", options).format(
          date
        );
        return formattedDate.replace(",", "");
      },
      translateStatus: function (status) {
        switch (status) {
          case "DONE":
            return "Đã thanh toán";
          case "ERROR":
            return "Lỗi";
          default:
            return "Chưa thanh toán";
        }
      },
      eq: function (a, b) {
        return a === b;
      },
    },
  })
);
app.set("view engine", "handlebars");

app.use(express.static("public"));
app.use(cookieParser("MY SECRET"));

//app.use(appMiddleware);

// function isAdmin(req, res, next) {
//   if (req.user && req.user.role === "admin") {
//     return next();
//   }
//   res.status(403).send("Forbidden");
// }

const productRouter = require("./routes/product.route");
const userRouter = require("./routes/user.route");
const cartRouter = require("./routes/cart.route");
const adminRouter = require("./routes/admin.route");
const accountRouter = require("./routes/account.route");
const paymentRouter = require("./routes/payment.route");
const billRouter = require("./routes/bill.route");

app.use("/", appMiddleware, userRouter);
app.use("/product", appMiddleware, productRouter);
app.use("/cart", appMiddleware, cartRouter);
app.use("/admin", loginMiddleware, adminRouter);
app.use("/account", accountRouter);
app.use("/payment", paymentRouter);
app.use("/bill", billRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
