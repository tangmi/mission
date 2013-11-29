'use strict';

// provides monitoring of running apps

(function(exports) {
	var path = require('path');

	var express = require('express');
	var app = express();

	var apps = require('../lib/apps'),
		daemon = require('../lib/daemon');

	var logger = require('../lib/logHandler').defaultLogger;

	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/services', function(req, res) {
		res.json(apps());
	});

	app.get('/service/:serviceName', function(req, res) {
		//service status
		var name = req.params.serviceName;
		var service = apps(name);
		if(service) {
			res.json({
				service: service,
				attr: service.attr(),
				data: service.data()
			});
		} else {
			res.send(404);
		}
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