const mysql = require('mysql2');

const pool = mysql.createPool(require("../credentials/dbCredentials"))

module.exports = (callback) =>{
   pool.getConnection(function(err, connection) {
        callback(err, connection)
        connection.release();

  })

};