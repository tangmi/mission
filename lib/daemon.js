'use strict';

(function(exports) {

	var spawn = require('child_process').spawn,
		fs = require('fs'),
		path = require('path');

	var logHandler = require('./logHandler'),
		logger = logHandler.defaultLogger;

	var configure = require('./configure');

	var processes = {};


	function start() {
		logger.info("Starting...");

		var sites = configure.get('sites');

		for (var serviceName in sites) {
			if (sites.hasOwnProperty(serviceName)) {
				var site = sites[serviceName];
				if (site.enabled) {
					startApp(serviceName, site);
				}
			}
		}


		logger.info("Started.");
	}

	function reload() {
		logger.info("Reloading...");

		var queue = configure.queue.read();
		var i;
		for (i = 0; i < queue.length; i++) {
			var serviceName = queue[i];
			if (processes[serviceName]) {
				//if the process is running we want to kill it
				processes[serviceName].kill();
				logger.info("Stopped " + serviceName);
			} else {
				//if it is not running, we want to start it
				var service = configure.get('sites')[serviceName];
				startApp(serviceName, service);
			}

		}


		logger.info("Reloaded.");
	}

	var appDirectory = configure.get('paths.app-directory');

	function startApp(serviceName, service) {

		logger.warn('Attempting to start node app: ' + serviceName);
		if (processes[serviceName]) {
			logger.warn(serviceName + ' already running!');
			return;
		}

		try {
			var cwd = process.cwd();

			var appDir = path.join(appDirectory, serviceName);
			process.chdir(appDir);

			var pkg = fs.readFileSync('package.json');
			var start = JSON.parse(pkg)['scripts']['start'];

			var params = start.split(' ');
			var cmd = params.splice(0, 1)[0];

			process.env.PORT = service.port;
			processes[serviceName] = spawn(cmd, params, {
				cwd: appDir,
				env: process.env
			});

			processes[serviceName].stdout.on('data', function(data) {
				logHandler.getLogger(serviceName).info(data.toString());
			});

			processes[serviceName].stderr.on('data', function(data) {
				logHandler.getLogger(serviceName).error(data.toString());
			});

			processes[serviceName].on('close', function(code) {
				logger.info(serviceName + ': process closed (code: ' + code + ')');
			});

			process.chdir(cwd);

			logger.info("Started " + serviceName + '. PID: ' + processes[serviceName].pid);


		} catch (e) {
			logger.error(e.message);
		}
	}

	function stop() {

		for (var serviceName in processes) {
			if (processes.hasOwnProperty(serviceName)) {
				logger.info('Killing process ' + processes[serviceName].pid);
				processes[serviceName].kill();
			}
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