'use strict';

var hogan = require('hogan.js');
var nginxTemplate = loadTemplate('nginx-site');

var spawn = require('child_process').spawn,
	fs = require('fs'),
	path = require('path');

var logHandler = require('./logHandler'),
	logger = logHandler.defaultLogger;

var config = require('../config');

var processes = {};

function stopApp() {

}

function startApp(serviceName, ) {

	logger.warn('Attempting to start node app: ' + serviceName);
	if (processes[serviceName]) {
		logger.warn(serviceName + ' already running!');
		return;
	}

	try {

		var cwd = process.cwd();

		var appDir = path.join(config.appfolder, serviceName);
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

function makeNginxConfig() {
	var nginxConfig = nginxTemplate.render({
		appname: serviceName,
		hostname: site.hostname,
		port: site.port
	});
}