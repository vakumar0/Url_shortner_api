var validUrl = require('valid-url');
var connection = require('../../config/mySqlConnection');
var masterConfig = require('../../config/masterConfig');
var passwordValidator = require('password-validator');
var moment= require('moment');

exports.getOrginalUrl = (req, res, next ) => {

  console.log('function getOrginalUrl => start_____________');
  let url = 'https://vakumar-urlshortner.netlify.app/?' + req.params.shortUrl;    
  console.log('function getOrginalUrl => shortURL: ' + url);

  const queryString = "SELECT original_url, is_password_protected, is_expiry_enabled, expiry_time \n" +
                      " FROM heroku_cb513ed70e38b31.`url_shortner.url_shortner_master` \n" +
                      " WHERE short_url = '"+ url + "';"
  
  connection.query(queryString, (err, rows, fields) =>{
    if(err) {      
      throw err;
    } else {
      if (rows[0] != undefined) {
        console.log('function getOrginalUrl => response data: ' + JSON.stringify(rows[0]));        
        handleExpiryDate(rows, res);        
      } else {
        console.log('function getOrginalUrl => no url found');
        res.json({message: "URL not found", is_success: false, openNewPage: false});      
      }      
    }

    if(rows[0].is_logging_enabled)
      logInDb(rows);
  });
}

let handleExpiryDate = (rows, res) => {
  if(rows[0].is_expiry_enabled === 1) {
    console.log('function getOrginalUrl => is_expiry_enabled: true' );
    
    let expiry_time = rows[0].expiry_time;
    let expiryTime = moment(expiry_time).format("YYYY-MM-DD hh:mm:ss")
    expiryTime = new Date(expiryTime);
    let current_time = new Date();
    let currentTime = moment(current_time).format("YYYY-MM-DD hh:mm:ss");
    currentTime = new Date(currentTime);
    let diffTime = expiryTime - currentTime ;
    
    console.log('function getOrginalUrl => diffTime: ' + diffTime );
    
    if( diffTime >= 0) { 
      res.json({message: rows[0].original_url, is_success: true, openNewPage: true});    
    } else {
      res.json({message: "URL has expired", is_success: false, openNewPage: false});    
    } 
  } else {
    res.json({message: rows[0].original_url, is_success: true, openNewPage: true});   
  }
}

exports.getAllURLs = (req, res, next) => {    
  console.log('function getAllURLs => start_______________');
  const queryString = "SELECT * FROM `url_shortner.url_shortner_master`";
  connection.query( queryString, (err, rows, fields) => {
    if(err) {
      throw err;
    } else {    
      res.send(rows);
    }
  });
}

exports.getShortUrl = (req, res, next) => {
  console.log('function getShortUrl => start_______________');
  console.log('function getShortUrl => object: ' + JSON.stringify(req.body));
  validation(req, res);
}

let validation = (req, res) => {
  if(req.body.is_password_protected)
    if(!validatePassword(req, res)) 
      res.json({ message: 'Password should contain atleast 8 letters and no spaces', is_success: false, openNewPage: false});
  
  if(req.body.is_custom_url) 
    res.json(validateCustomUrl(req, res));
  else 
    validateUrl(req, res);
  
}

let validatePassword = (req, res) => {
  let schema = new passwordValidator();
  schema
  .is().min(8)
  .has().not().spaces();

  return schema.validate(req.body.password)
}

let isUniqueUrl = (req, res, randomUrl) => { 
  
  return new Promise((resolve, reject) => {
    const queryString = "SELECT COUNT(id) AS url_count \n" +
                      " FROM heroku_cb513ed70e38b31.`url_shortner.url_shortner_master` \n" +
                      " WHERE short_url = '"+ [randomUrl] + "';"
  
    console.log(queryString);

    connection.query(queryString, (err, rows, fields) =>{
      if(err) {      
        throw err;
      } else {
        if (rows[0].url_count >= 1) {
          //res.send('ouch')
          // res.json({message: "URL not found", is_success: false, openNewPage: false}); 
          reject(false);      
        }          
        else            
          resolve(true);
      }
    });
  });
  
}

let saveUrlInDb =  (req, res, randomUrl) => {

  return new Promise( (resolve, reject) => {
    const queryString = "INSERT INTO `url_shortner.url_shortner_master` \n" + 
    "(short_url, original_url, is_password_protected, password, is_logging_enabled, is_expiry_enabled, expiry_time, created_by, created_on, action ) \n" +
    "VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    connection.query(queryString, [randomUrl, req.body.original_url, req.body.is_password_protected, req.body.password, req.body.is_logging_enabled, req.body.is_expiry_enabled, req.body.expiry_time, req.body.created_by, req.body.created_on, 'create'], (err, rows, fields) =>{
      if(err) {      
        throw err;
      } else {                         
        console.log('function saveUrlInDb => url saved successfully');      
        
        let result = { 
          message: 'Url saved successfully', 
          url: randomUrl, 
          is_success: true,
          openNewPage: false
        };
        
        resolve(result);
      }
    });  
  })
  
}

let saveUrl =  (req, res, attempts) => {
  console.log('function saveUrl => start');
  let randomUrl = '';
  
  if(req.body.is_custom_url)
    randomUrl = req.body.custom_url;
  else 
    randomUrl = 'https://vakumar-urlshortner.netlify.app/?' + generateRandomString();    
  
    isUniqueUrl(req, res, randomUrl)
    .then( function(result){
      console.log('function saveUrl => isUniqueUrl promise: ' + result);      
      saveUrlInDb(req, res, randomUrl).then( result => res.json(result)) ;                
    })
    .catch(function(err) {
      console.log('function saveUrl => isUniqueUrl promise: ' + err);     
      //test(req, res);
      //return false; 
    }); 

}

let logInDb = (rows) => {

  let current_time = new Date();
  let currentTime = moment(current_time).format("YYYY-MM-DD hh:mm:ss");

  const queryString = "INSERT INTO `url_shortner.url_shortner_master` \n" + 
  "(short_url, original_url, is_password_protected, password, is_logging_enabled, is_expiry_enabled, expiry_time, created_by, created_on, action, modified_on ) \n" +
  "VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(queryString, [rows[0].short_url, rows[0].original_url, rows[0].is_password_protected, rows[0].password, rows[0].is_logging_enabled, rows[0].is_expiry_enabled, rows[0].expiry_time, 'admin', rows[0].created_on, 'Fetch', currentTime], (err, rows, fields) =>{
    if(err) {      
      throw err;
    } else {           
      console.log('function logInDb => url saved successfully');     
    }
  });  
}

let validateCustomUrl = (req, res) => {
  console.log('function validateCustomUrl => start');
  console.log('function validateCustomUrl => url recieved: ' + req.body.custom_url);
  if (validUrl.isUri(req.body.custom_url) && req.body.custom_url.includes('https://vakumar-urlshortner.netlify.app/?')){    
    return validateUrl(req);
  } else {
    console.log('function getShortUrl => incorrect custom url');
    return { message: "incorrect custom URL entered, please verify url starts with https://vakumar-urlshortner.netlify.app/?", is_success: false, openNewPage: false};
  }
}

let validateUrl = (req, res) => {
  console.log('function validateUrl => start');
  console.log('function validateUrl => url recieved: ' + req.body.original_url);
  if (validUrl.isUri(req.body.original_url)){  
    // if(saveUrl(req, res, 0) === false )  {
    //   console.log('function validateUrl => response recieved');
    //   res.json({message: "URL has is not unique", is_success: false, openNewPage: false});
    // }      
    // else 
      return saveUrl(req, res, 0);        
  } else {
    console.log('function getShortUrl => incorrect url');
    res.json({ message: "incorrect URL entered", is_success: false, openNewPage: false});
  }
}

let generateRandomString = () => {
  var randomString = '';
  for (var i = masterConfig.urlGeneratorLength; i > 0; --i) {
    randomString += masterConfig.urlGeneratorChars[Math.round(Math.random() * (masterConfig.urlGeneratorChars.length - 1))];
  }    
  return randomString;
}
