#!/usr/bin/env node

'use strict';

var exec = require('child_process').exec;
exec('which nginx', function(err, stdout, stderr) {
	console.log();
});


var program = require('commander'),
	def = require('../package.json'),
	path = require('path'),
	forever = require('forever'),
	mcc = require(path.join(__dirname, '../lib/index'));

program.version(def.version);
// program.usage('[path] [options]')
// program.option('-p, --port <port>', 'set a custom port (default 9000)')
// program.on('--help', function() {
// 	console.log('  Path:');
// 	console.log('');
// 	console.log('    directory to start the static server in. will use current directory if not supplied.');
// 	console.log('');
// });

program
	.command('init')
	.description('initializes the current directory for mcc-server')
	.action(function(options) {
		mcc.init(options);
	});

program
	.command('add')
	.description('adds a service to mcc')
	.action(function(options) {});

program
	.command('remove')
	.description('removes a service from mcc')
	.action(function(options) {});

program
	.command('enable')
	.description('enables a service in nginx and makes it "live"')
	.action(function(options) {});

program
	.command('disable')
	.description('removes a service from the enabled list')
	.action(function(options) {});

program
	.command('start')
	.description('start the mission server with forever')
	.action(function(options) {
		new Error('not implemented');
		// var mccServer = path.join(__dirname, '../lib/server/index');

		// var child = new(forever.Monitor)(mccServer, {
		// 	max: 3,
		// 	silent: true,
		// 	options: []
		// });

		// child.on('exit', function(a) {
		// 	console.log(a)
		// });
		// child.start();
	});

program.parse(process.argv);