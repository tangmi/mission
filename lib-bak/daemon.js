'use strict';

(function(exports) {

	var spawn = require('child_process').spawn,
		fs = require('fs'),
		path = require('path');

	var logHandler = require('./logHandler'),
		logger = logHandler.defaultLogger,
		launcher = require('./launcher');

	var configure = require('./configure');

	var processes = {};

	function start() {
		logger.info("Starting...");

		configure.get('sites', function(sites) {

			for (var serviceName in sites) {
				if (sites.hasOwnProperty(serviceName)) {
					var site = sites[serviceName];
					if (site.enabled) {
						startApp(serviceName, site);
					}
				}
			}

			logger.info("Started.");
		});
	}

	function reload() {
		logger.info("Reloading...");

		configure.queue.read(function(queue) {

			var i;
			for (i = 0; i < queue.length; i++) {
				var serviceName = queue[i];
				configure.get('sites', function(sites) {
					var service = sites[serviceName];

					if (processes[serviceName] && !service.enabled) {
						//if the process is running we want to kill it
						processes[serviceName].kill();
						logger.info("Stopped " + serviceName);
					} else {
						//if it is not running, we want to start it
						startApp(serviceName, service);

					}
				});

			}

			logger.info("Reloaded.");
		});
	}

	function startApp(serviceName, service) {
		launcher.startApp();
	}

	function stop() {

		for (var serviceName in processes) {
			logger.info('Killing process ' + processes[serviceName].pid);
			processes[serviceName].kill();
		}

		logger.info("Stopping...");
		monitoring.stop(function() {
			logger.info("Stopped.");
		});
	}

	process.on("SIGUSR1", reload);
	process.once("SIGTERM", stop);

	start();

	// start the monitoring app (port 9000)
	var monitoring = require('./monitoring/index');
	monitoring.start();

})(module.exports);