var express = require('express');
var router = express.Router();
var url_shortner = require('../controllers/url_shortner');


router.get('/:shortUrl', url_shortner.getOrginalUrl);

router.get('/api/getAllURLs', url_shortner.getAllURLs);

router.post('/api/getShortUrl', url_shortner.getShortUrl);

module.exports = router;