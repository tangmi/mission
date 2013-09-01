'use strict';

// provides monitoring of running apps

(function(exports) {
	var path = require('path');

	var express = require('express');
	var app = express();

	var logger = require('../logHandler').defaultLogger;

	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/services', function(req, res) {
		res.send(501);
	});

	app.get('/service/:serviceName', function(req, res) {
		//service status
		res.send(501);
	});

	app.get('/service/:serviceName/log', function(req, res) {
		res.send(501);
	});

	var server;
	exports.start = function() {
		server = app.listen(9000);
		logger.info('Monitoring app listening on port 9000');
	};

	exports.stop = function(callback) {
		server.close(callback);
	};

})(module.exports);