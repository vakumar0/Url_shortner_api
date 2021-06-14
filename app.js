const express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
const app = express();
const port = 8000;

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});