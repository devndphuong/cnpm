const mysql = require("mysql");
const config = require("../config/default.json");

// const connection = mysql.createConnection(config.mysql);
// connection.connect();

const pool = mysql.createPool(config.mysql);

module.exports = {
  load: function (sql) {
    return new Promise(function (resolve, reject) {
      pool.query(sql, function (error, result, fields) {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  },
  loadSingle: function (sql) {
    return new Promise(function (resolve, reject) {
      pool.query(sql, function (error, result, fields) {
        if (error) {
          return reject(error);
        }
        if (result.length > 0) {
          resolve(result[0]); // Lấy phần tử đầu tiên
        } else {
          resolve(null); // Không có dữ liệu
        }
      });
    });
  },
  addToCart: function (table, obj) {
    return new Promise(function (resolve, reject) {
      var sql = "insert into " + table + " set ?";
      pool.query(sql, obj, function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  deleteProductInCart: function (table, cusID, productId, size) {
    return new Promise(function (resolve, reject) {
      var sql =
        "delete from " +
        table +
        " where customerID = " +
        cusID +
        " and productId = " +
        productId +
        " and size = " +
        size;
      pool.query(sql, function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  update: function (table, obj) {
    return new Promise(function (resolve, reject) {
      var sql = "update " + table + "set ? where ?";
      pool.query(sql, function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  insert: function (table, obj) {
    return new Promise(function (resolve, reject) {
      const sql = "INSERT INTO " + table + " SET ?";
      pool.query(sql, obj, function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  delete: function (table, condition) {
    return new Promise(function (resolve, reject) {
      const sql = "DELETE FROM " + table + " WHERE ?";
      pool.query(sql, condition, function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
};
