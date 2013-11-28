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
		cwd: path.join(__dirname, '..'),
		// pidfile: path.join(config.missionfolder, 'mission.pid'), //default /var/run/mission.pid
		// user: 'git',
		// group: 'git',
		silent: true
	});

if (process.getuid() != 0) {
	logger.warn('expected to run as root, exiting.');
	process.exit(1);
}

daemon
	.on('starting', function() {
		logger.info('starting daemon...');
	})
	.on('started', function(pid) {
		logger.info('daemon started. (pid=%d)', pid);
	})
	.on('stopping', function() {
		logger.info('stopping daemon...');
	})
	.on('stopped', function(pid) {
		logger.info('daemon stopped.');
	})
	.on('running', function(pid) {
		logger.info('daemon already running. (pid=%d)', pid);
	})
	.on('notrunning', function() {
		logger.info('daemon is not running');
	})
	.on('error', function(err) {
		logger.info('daemon failed to start: %s', err.message);
	});

program.version(def.version);

// program.usage('[path] [options]')
// program.option('-p, --port <port>', 'set a custom port (default 9000)')
// program.on('--help', function() {
// 	logger.info('  Path:');
// 	logger.info('');
// 	logger.info('    directory to start the static server in. will use current directory if not supplied.');
// 	logger.info('');
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
			console.log('mission running. (pid=' + pid + ')');
		} else {
			console.log('mission is not running.');
		}
	});



// service related commands
var apps = require('../lib/apps');

program
	.command('enable <service>')
	.description('enables a service in nginx and makes it live')
	.action(function(service, options) {
		var app = apps(service);
		if(app) {
			app.data('enabled', true);
			daemon.sendSignal("SIGUSR1");
			logger.info('enabled app %s', service);
		} else {
			logger.info('could not enable app "%s"', service);
		}
	});

program
	.command('disable <service>')
	.description('removes a service from the enabled list and takes it down')
	.action(function(service, options) {
		var app = apps(service);
		if(app) {
			app.data('enabled', false);
			daemon.sendSignal("SIGUSR1");
			logger.info('disabled app %s', service);
		} else {
			logger.info('could not disable app "%s"', service);
		}
	});

program
	.command('reload')
	.description('tells mcc to update its state to match the config')
	.action(function(service, options) {
		daemon.sendSignal("SIGUSR1");
		logger.info('sent signal to daemon to reload apps')
	});

program
	.command('list')
	.description('lists all available sites')
	.action(function(options) {
		var list = apps();
		var out = [];
		for(var i = 0; i < list.length; i++) {
			var service = apps(list[i]);
			var enabled = service.data('enabled');
			out.push(list[i] + '\t' + (enabled ? 'enabled' : ''));
		}
		console.log('%d app' + (list.length === 1 ? '' : 's') + '\n%s', list.length, out.join('\n'));
	});


program.parse(process.argv);

if (!program.args.length) {
	//show help if no command is chosen
	program.help();
}