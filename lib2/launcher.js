var path = require('path'),
	spawn = require('child_process').spawn;

var logHandler = require('./logHandler'),
	logger = logHandler.defaultLogger;

var Service = require('./structs').Service,
	Process = require('./structs').Process;

var apps = require('./apps');

var config = require('../config');

//key=servicename, value=process
var processes = {};



//for testing
startApp(apps('test'));
// console.log(processes);



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

	process.env.PORT = 9000; //TODO find port
	processes[service.name] = spawn(cmd, params, {
		cwd: appDir,
		env: process.env
	});

	processes[service.name].stdout.on('data', function(data) {
		printAppOutput('log', service.name, data.toString());
		logHandler.getLogger(service.name).info(data.toString());
	});

	processes[service.name].stderr.on('data', function(data) {
		printAppOutput('err', service.name, data.toString());
		logHandler.getLogger(service.name).error(data.toString());
	});

	processes[service.name].on('close', function(code) {
		logger.info(service.name + ': process closed (code: ' + code + ')');
	});

	processes[service.name].on('close', function(code, signal) {
		logger.info(service.name + ': process exited (code: ' + code + ' signal: ' + signal + ')');
		delete processes[service.name];
	});

	logger.info(service.name + ': started. PID: ' + processes[service.name].pid);
}

function stopApp(service) {
	//untested!
	processes[service.name].kill('SIGTERM');
	setTimeout(function() {
		//check if app is closed, if not, kill it
		if(processes[service.name]) {
			stopApp(service);
		}
	}, 1000);
}

function restartApp(service) {
	stopApp(service);
	startApp(service);
}

function findProcessByServiceName(name) {
	for (var i = 0; i < processes.length; i++) {
		if (processes[i].service.name == name) {
			return processes[i];
		}
	}
	return false;
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