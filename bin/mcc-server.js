#!/usr/bin/env node

'use strict';

var program = require('commander'),
	def = require('../package.json'),
	path = require('path'),
	mccServer = require(path.join(__dirname, '../lib/server/index'));

program.version(def.version);

program
	.command('start')
	.description('starts the')
	.action(function(options) {
		mccServer.start(options);
	});


program.parse(process.argv);