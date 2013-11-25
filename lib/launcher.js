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
// startApp(apps('test'));
// startApp(apps('test'));


/*
 * exported methods
 */

//start an service from a parsed MissionFile
function startApp(service) {
	var running = findProcessByServiceName(service.name);
	if(running) {
		logger.warn('%s: app already running!', service.name);
		return;
	}

	logger.info('%s: starting app...', service.name);
	logger.info('running command: `%s`', service.start);

	var appDir = path.join(config.appfolder, service.name);

	var params = service.start.split(' ');
	var cmd = params.splice(0, 1)[0];

	var oldport = process.env.PORT;

	var port = findNextPort();
	process.env.PORT = port;
	logger.debug('found port %d for %s', process.env.PORT, service.name);
	processes[service.name] = spawn(cmd, params, {
		cwd: appDir,
		env: process.env
	});
	process.env.PORT = oldport;

	service.attr('port', port);

	processes[service.name].stdout.on('data', function(data) {
		printAppOutput('log', service.name, data.toString());
		logHandler.getLogger(service).info(data.toString());
	});

	processes[service.name].stderr.on('data', function(data) {
		printAppOutput('err', service.name, data.toString());
		logHandler.getLogger(service).error(data.toString());
		//TODO: email me?
		//https://github.com/guileen/node-sendmail
	});

	processes[service.name].on('close', function(code) {
		logger.info('%s: process closed (code=%d)', service.name, code);
	});

	processes[service.name].on('close', function(code, signal) {
		logger.info('%s: process exited (code=%d, signal=%s)', service.name, code, '' + signal);
		if(+code > 0) {
			logger.warn('app "%s" closed with an error! (code=%d)', service.name, code);
			//TODO: email me?
		}
		delete processes[service.name];
	});

	logger.info('%s: started (port=%d, pid=%d)', service.name, port, processes[service.name].pid);
}

function stopApp(service) {
	logger.info('%s: stopping app...', service.name);
	processes[service.name].kill('SIGTERM');
}

function restartApp(service) {
	//untested!
	stopApp(service);
	setTimeout(function() {
		startApp(service);
	}, 2000);
}

function stopAll() {
	for(var name in processes) {
		stopApp(apps(name));
	}
}

/*
 * exports
 */

module.exports.start = startApp;
module.exports.stop = stopApp;
module.exports.restart = restartApp;
module.exports.stopAll = stopAll;

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
		logger.debug('used ports: [%s]', ports.join(','))
	}
	while (ports.indexOf(assigned) !== -1) {
		assigned++;

		if (assigned >= end) {
			throw new Error('Can\'t find an empty port (' + start + '-' + end + '), giving up!');
		}
	}
	return assigned;
}

/*
 * purely debug stuff
 */

//print app output indented with a name
function printAppOutput(level, name, msg) {
	var prefix = level + '(' + name + '): ';
	var indent = '';
	for(var i = 0; i < prefix.length; i++) {
		indent += ' ';
	}
	msg = msg.split('\n').join('\n' + indent);

	//this output is in {config.logFolder}/{name}.log, so we don't
	// need to use winston to log it
	console.log(prefix + msg);
}