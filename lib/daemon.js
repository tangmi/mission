'use strict';

(function(exports) {

	var fork = require('child_process').fork;

	var logHandler = require('./logHandler'),
		logger = logHandler.defaultLogger;

	// start the monitoring app (port 9000)
	var monitoring = require('./monitoring/index');
	monitoring.start();

	logger.info('what');

	function reload() {
		logger.info("Reloading...");
		throw new Error('not implemented');
		logger.info("Reloaded.");
	};

	function stop() {
		logger.info("Stopping...");
		monitoring.stop(function() {
			logger.info("Stopped.");
		});
	};

	process.on("SIGUSR1", reload);
	process.once("SIGTERM", stop);

})(module.exports);