const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'app_chat',
  password: 'password'
});

module.exports = connection