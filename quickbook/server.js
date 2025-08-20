var http = require("http");
var fs = require("fs");
var soap = require("soap");
var server = http.createServer(function (req, res) {
  res.end("404: Not Found: " + req.url);
});

var port = process.env.QB_SOAP_PORT || 8000;

/**
 * A constant for the WSDL filename.
 * @type {string}
 */
var WSDL_FILENAME = "/qbws.wsdl";

/**
 * Fetches the WSDL file for the
 * SOAP service.
 *
 * @returns {string} contents of WSDL file
 */
function buildWsdl() {
  var wsdl = fs.readFileSync(__dirname + WSDL_FILENAME, "utf8");

  return wsdl;
}

//////////////////
//
// Public
//
//////////////////

module.exports = Server;

function Server() {
  this.wsdl = buildWsdl();
  this.webService = require("./web-service");
}

Server.prototype.run = function () {
  var soapServer;
  server.listen(port);
  soapServer = soap.listen(server, "/wsdl", this.webService.service, this.wsdl);
  console.log("Quickbooks SOAP Server listening on port " + port);
};

Server.prototype.setQBXMLHandler = function (qbXMLHandler) {
  this.webService.setQBXMLHandler(qbXMLHandler);
};

// Add method to attach to existing Express server
Server.prototype.attachToServer = function (expressServer, path) {
  var soapServer;
  soapServer = soap.listen(
    expressServer,
    path,
    this.webService.service,
    this.wsdl
  );
  console.log("Quickbooks SOAP Server attached to Express server at " + path);
  return soapServer;
};
