var mysql = require('mysql');

var connection = mysql.createConnection({
   host: 'us-cdbr-east-03.cleardb.com',
   port: '3306',
   user: 'b634089b5fd87a',
   password: 'a292898e',
   database: 'heroku_cb513ed70e38b31'
});

connection.connect(function(err){
    console.log('mysql connection started');
    if(err) {
     console.error('error connection' + err.stack);
     return;
    }
    console.log('mysql connected successfully');
});

setInterval(function () {
    connection.query('SELECT 1');
}, 5000);

module.exports = connection;