/*
 * launcher.js
 *
 * manages starting/stopping services and piping their
 * output to the correct logfiles
 * 
 */

var path = require('path'),
	spawn = require('child_process').spawn;

var logHandler = require('./logHandler'),
	logger = logHandler.defaultLogger;

var apps = require('./apps'),
	Service = apps.Service;

var config = require('../config');

//key=servicename
//value=(process + extra port field)
var processes = {};



//for testing
startApp(apps('test'));
startApp(apps('test'));


/*
 * exported methods
 */

//start an service from a parsed MissionFile
function startApp(service) {
	var running = findProcessByServiceName(service.name);
	if(running) {
		logger.warn(service.name + ' already running!');
		return;
	}

	logger.info(service.name + ': starting app...');
	logger.info(service.start);

	var appDir = path.join(config.appfolder, service.name);

	var params = service.start.split(' ');
	var cmd = params.splice(0, 1)[0];

	var oldport = process.env.PORT;

	process.env.PORT = findNextPort();
	logger.debug('found port %d for %s', process.env.PORT, service.name);
	processes[service.name] = spawn(cmd, params, {
		cwd: appDir,
		env: process.env
	});

	//move the port to an apps.js storage api
	// processes[service.name].port = process.env.PORT;
	apps(service.name).attr('port', process.env.PORT);

	//reset to old port env value
	process.env.PORT = oldport;

	processes[service.name].stdout.on('data', function(data) {
		printAppOutput('log', service.name, data.toString());
		logHandler.getLogger(service).info(data.toString());
	});

	processes[service.name].stderr.on('data', function(data) {
		printAppOutput('err', service.name, data.toString());
		logHandler.getLogger(service).error(data.toString());
	});

	processes[service.name].on('close', function(code) {
		logger.info(service.name + ': process closed (code: ' + code + ')');
	});

	processes[service.name].on('close', function(code, signal) {
		logger.info(service.name + ': process exited (code: ' + code + ' signal: ' + signal + ')');
		delete processes[service.name];
	});

	logger.info(service.name + ': started (port: ' + processes[service.name].port + '). PID: ' + processes[service.name].pid);
}

function stopApp(service) {
	//untested!
	logger.info(service.name + ': stopping app...');
	processes[service.name].kill('SIGTERM');
	setTimeout(function() {
		//check if app is closed, if not, kill it
		if(processes[service.name]) {
			stopApp(service);
		}
	}, 1000);
}

function restartApp(service) {
	//untested!
	stopApp(service);
	setTimeout(function() {
		startApp(service);
	}, 2000);
}


/*
 * exports
 */

module.exports.start = startApp;
module.exports.stop = stopApp;
module.exports.restart = restartApp;


/*
 * helper methods
 */

function findProcessByServiceName(name) {
	for (var servicename in processes) {
		if (servicename == name) {
			return processes[servicename];
		}
	}
	return false;
}

function findNextPort() {
	var start = 9001;
	var end = 9999;

	var assigned = start;
	var ports = [];
	for (var name in processes) {
		ports.push(apps(name).attr('port'));
	}
	while (ports.indexOf(assigned) !== -1) {
		assigned++;

		if (assigned >= end) {
			throw new Error('Can\'t find an empty port (' + start + '-' + end + '), giving up!');
		}
	}
	return assigned;
}

//print app output indented with a name
function printAppOutput(level, name, msg) {
	var prefix = level + '(' + name + '): ';
	var indent = '';
	for(var i = 0; i < prefix.length; i++) {
		indent += ' ';
	}
	msg = msg.split('\n').join('\n' + indent);
	console.log(prefix + msg);
}