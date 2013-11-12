#!/usr/bin/env node

'use strict';

var program = require('commander'),
	def = require('../package.json'),
	path = require('path');

var logger = require('../lib/logHandler').defaultLogger,
	config = require('../config');

var daemon = require('daemonize2')
	.setup({
		main: path.join(__dirname, '../lib/daemon.js'),
		name: 'mission',
		// pidfile: path.join(config.missionfolder, 'mission.pid'), //default /var/run/mission.pid
		// user: 'git',
		// group: 'git',
		silent: false
	});

// if (process.getuid() != 0) {
// console.log('Expected to run as root');
// process.exit(1);
// }

daemon
	.on('starting', function() {
		// console.log('Starting daemon...');
	})
	.on('started', function(pid) {
		// console.log('Daemon started. PID: ' + pid);
		logger.info('daemon started. PID: ' + pid);
	})
	.on('stopping', function() {
		// console.log('Stopping daemon...');
	})
	.on('stopped', function(pid) {
		// console.log('Daemon stopped.');
		logger.info('daemon stopped.');
	})
	.on('running', function(pid) {
		// console.log('Daemon already running. PID: ' + pid);
	})
	.on('notrunning', function() {
		// console.log('Daemon is not running');
	})
	.on('error', function(err) {
		// console.log('Daemon failed to start: ' + err.message);
		logger.info('daemon failed to start: ' + err.message);
	});

program.version(def.version);

// program.usage('[path] [options]')
// program.option('-p, --port <port>', 'set a custom port (default 9000)')
// program.on('--help', function() {
// 	console.log('  Path:');
// 	console.log('');
// 	console.log('    directory to start the static server in. will use current directory if not supplied.');
// 	console.log('');
// });

// process related commands
program
	.command('start')
	.description('start the mission daemon')
	.action(function(options) {
		daemon.start();
	});

program
	.command('stop')
	.description('stop the mission daemon')
	.action(function(options) {
		daemon.stop();
	});

program
	.command('restart')
	.description('restart the mission daemon')
	.action(function(options) {
		daemon.stop(function(err) {
			daemon.start();
		});
	});

program
	.command('kill')
	.description('kill the mission daemon')
	.action(function(options) {
		daemon.kill();
	});

program.command('status')
	.description('get the running status of the daemon')
	.action(function(options) {
		var pid = daemon.status();
		if (pid) {
			console.log('mission running. (PID: ' + pid + ')');
		} else {
			console.log('mission is not running.');
		}
	});



// service related commands
var setup = require('../lib/setup');
program
	.command('add <service> <hostname>')
	.description('adds a service to mcc')
	.action(function(service, hostname, options) {
		setup.add(service, hostname);
	});

program
	.command('remove <service>')
	.description('removes a service from mcc')
	.action(function(service, options) {
		setup.remove(service);
	});

program
	.command('enable <service>')
	.description('enables a service in nginx and makes it live')
	.action(function(service, options) {
		setup.enable(service);
		// daemon.sendSignal("SIGUSR1");
	});

program
	.command('disable <service>')
	.description('removes a service from the enabled list and takes it down')
	.action(function(service, options) {
		setup.disable(service);
		// daemon.sendSignal("SIGUSR1");
	});

program
	.command('reload')
	.description('tells mcc to update its state to match the config')
	.action(function(service, options) {
		daemon.sendSignal("SIGUSR1");
	});

program
	.command('list')
	.description('lists all available sites')
	.action(function(options) {
		console.log(setup.list());
	});



// configuration commands
var configure = require('../lib/configure');
program
	.command('config [key] [value]')
	.description('sets/gets configuration values')
	.option('-l, --list', 'lists all set configurations')
	.action(function(key, value, options) {
		if (options.list) {
			console.log(configure.list());
		} else {
			if (key && value) {
				configure.set(key, value, function() {});
			} else if (key) {
				configure.get(key, function(value) {
					console.log(value);
				});
			} else {
				console.log('');
				console.log('  Usage: mcc config[options][key][value]');
				console.log('');
				console.log('  Options: ')
				console.log('');
				console.log('    -l, --list lists configuration key value pairs');
				console.log('');
			}
		}
	});


program.parse(process.argv);

if (!program.args.length) {
	//show help if no command is chosen
	program.help();
}