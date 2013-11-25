/*
 * logHandler.js
 *
 * handles winston log output to a main logger and to app-specific
 * loggers, by a struct.Service
 * 
 */

'use strict';

(function() {
	var fs = require('fs'),
		path = require('path');
	var winston = require('winston');
	var config = require('../config'),
		logsFolder = config.logfolder;

	var defaultLogger = new(winston.Logger)({
		transports: [
			new(winston.transports.Console)({
				level: 'debug', //super verbose logging
				handleExceptions: true
			}), //just for debugging
			new(winston.transports.File)({
				filename: path.join(config.missionfolder, 'mission.log'),
				handleExceptions: true
			})
		],
		exitOnError: true
	});

	if (!(fs.existsSync(logsFolder) && fs.statSync(logsFolder).isDirectory())) {
		defaultLogger.info('App logs folder doesn\'t exists, creating it at: ' + logsFolder);
		fs.mkdirSync(logsFolder);
	}

	var appLoggers = {};

	module.exports = {
		defaultLogger: defaultLogger,
		getLogger: function(service) {
			if (!appLoggers[service.name]) {
				appLoggers[service.name] = new(winston.Logger)({
					transports: [
						new(winston.transports.File)({
							filename: logsFolder + '/' + service.name + '.log'
						})
					]
				});
			}
			return appLoggers[service.name];
		}
	};
})();