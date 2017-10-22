/*
 * A primitive HTTP server whose main role is a REST API
 */

'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const webDomain = 'http://web.mycompany.com';
const webFilesRoot = '../../';
const port = 80;

// Read configuration
const appConfig = require('../app.config.json');

// Import our class definitions
const GolfApiController = require('./logic/golfApiController');
const UserInfoApiController = require('./logic/userInfoApiController');
const TokenValidator = require('./plumbing/tokenValidator');
const ErrorHandler = require('./plumbing/errorHandler');
const ApiLogger = require('./plumbing/apiLogger');

/*
 * INITIAL SETUP
 */
const app = express();
ApiLogger.setLevel('info');

/*
 * PRIMITIVE WEB SERVER (http://mycompanyweb.com)
 * Serves web content and uses index.html as the default document
 */
app.get('/spa/*', function (request, response) {
	
    let resourcePath = request.path.replace('spa/', '');
    if (resourcePath === '/') {
	   resourcePath = 'index.html';
    }
    
    let webFilePath = path.join(`${__dirname}/${webFilesRoot}/spa/${resourcePath}`);
    response.sendFile(webFilePath);
});

app.get('/spa', function (request, response) {
    let webFilePath = path.join(`${__dirname}/${webFilesRoot}/spa/index.html`);
    response.sendFile(webFilePath);
});

app.get('/favicon.ico', function (request, response) {
    let webFilePath = path.join(`${__dirname}/${webFilesRoot}/spa/favicon.ico`);
    response.sendFile(webFilePath);
}); 

/*
 * REST API (http://mycompanyapi.com)
 * A REST API called across domains by the SPA using a CORS request, with OAuth access tokens
 */
const corsOptions = { origin: webDomain };
app.use('/api/*', cors(corsOptions));

app.get('/api/*', function (request, response, next) {
    
    // Both success and error responses return JSON data
    response.setHeader('Content-Type', 'application/json');
    
    // Always validate tokens before accessing business logic
    ApiLogger.info('API call', 'Validating token');
    let validator = new TokenValidator(request, response, appConfig.oauth);
    validator.validate()
        .then(next)
        .catch(error => { ErrorHandler.reportError(response, error); });
});

app.get('/api/golfers', function (request, response, next) {
    
    ApiLogger.info('API call', 'Request for golfer list');
    let controller = new GolfApiController(request, response, next);
    controller.getList();
});

app.get('/api/golfers/:id([0-9]+)', function (request, response, next) {
    
    let id = parseInt(request.params.id);
    ApiLogger.info('API call', `Request for golfer details for id: ${id}`);
    let controller = new GolfApiController(request, response, next);
    controller.getDetails(id);
});

app.get('/api/userclaims/current', function (request, response, next) {
    
    ApiLogger.info('API call', 'Request for current user info');
    let controller = new UserInfoApiController(request, response);
    controller.getUserClaims();
});

app.use('/api/*', function (unhandledException, request, response, next) {
    ErrorHandler.reportError(response, unhandledException);
});


/*
 * START LISTENING FOR HTTP REQUESTS
 */
app.listen(port, function () {
    ApiLogger.info('HTTP server', `Listening on port ${port}`);
});