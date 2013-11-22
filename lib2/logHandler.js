'use strict';

(function() {
	var fs = require('fs'),
		path = require('path');
	var winston = require('winston');
	var config = require('../config');

	var defaultLogger = new(winston.Logger)({
		transports: [
			new(winston.transports.Console)({
				handleExceptions: true
			}), //just for debugging
			new(winston.transports.File)({
				filename: path.join(config.missionfolder, 'mission.log'),
				handleExceptions: true
			})
		],
		exitOnError: true
	});

	var logsFolder = config.logfolder;
	if (!(fs.existsSync(logsFolder) && fs.statSync(logsFolder).isDirectory())) {
		defaultLogger.info('App logs folder doesn\'t exists, creating it at: ' + logsFolder);
		fs.mkdirSync(logsFolder);
	}

	var appLoggers = {};

	module.exports = {
		defaultLogger: defaultLogger,
		getLogger: function(serviceName) {
			if (!appLoggers[serviceName]) {
				appLoggers[serviceName] = new(winston.Logger)({
					transports: [
						new(winston.transports.File)({
							filename: logsFolder + '/' + serviceName + '.log'
						})
					]
				});
			}
			return appLoggers[serviceName];
		}
	};
})();