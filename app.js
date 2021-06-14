const express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
const app = express();
const port = 8000;
const path = require('path');

app.get('/favicon.ico', (req, res) => res.status(204));

//import routes
var urlShortnerRoutes = require('./api/routes/url_shortner');

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//use routes
app.use('/', urlShortnerRoutes);

app.get("/*", function (req, res) {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
})

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  console.log(err.message)
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// app.listen(port, () => {
  // console.log(`Example app listening on port ${port}!`)
// });