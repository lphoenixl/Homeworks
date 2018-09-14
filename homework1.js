
/*
*Primary file
*
*/

//dependencies

var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

//Instantiate HTTP Server

var httpServer = http.createServer(function(req,res){
  unifiedServer(req,res);
});

//Start the server on listening mode
httpServer.listen(config.httpPort,function(){
  console.log("Server is up on port "+config.httpPort+" in "+config.envName+" mode." );

});

//Instantiate HTTPS Server
var httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions,function(req,res){
  unifiedServer(req,res);
});

//Start HTTPS Server

httpsServer.listen(config.httpsPort,function(){
  console.log("Server is up on port "+config.httpsPort+" in "+config.envName+" mode." );

});

//Server logic for both HTTP and HTTPS

var unifiedServer = function(req,res){

  //Get url and parse it
  var parsedUrl = url.parse(req.url,true);

  //Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'');

  //Get the query string as an object

  var queryStringObject = parsedUrl.query;

  //Get the HTTP method

  var method = req.method.toLowerCase();

  //Get the headers as an object

  var headers = req.headers;

  //Get the payload

  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data',function(data){
    buffer += decoder.write(data);
  });
  req.on('end',function(){
    buffer +=decoder.end();

    //Choose the handler this request should go to
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound ;

    //Construct the data objet to send to handlers

    var data = {

      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    }
    // Route the request to the handlers specified in the router
    chosenHandler(data,function(statusCode,payload){
      //use the status code called back by handler, or default
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      //Use the payload called back by the handler or default to empty object
      payload = typeof(payload) == 'object' ? payload : {};
      // Convert payload to string
      var payloadString = JSON.stringify(payload);

      //Return the response
        res.setHeader('Content-Type','application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        //Log the request

        console.log('Return response: ',statusCode,payloadString);

    });

    // console.log('Request received on path: '+trimmedPath+ ' with '+method+ ' method and with these query string:',queryStringObject);

  });

};

//Define handlers
var handlers = {};

//Hello handlers
handlers.hello = function(data,callback){
  callback(200,{'hello':'Welcome to my first app trial!'});
};

//Ping handlers
handlers.ping = function(data,callback){
  callback(200);
};

//404 handler
handlers.notFound = function(data,callback){
 callback(404);
};

//Define a request router
var router = {
  'ping' : handlers.ping,
  'hello' : handlers.hello
};
