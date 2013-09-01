'use strict';

(function() {
	var fs = require('fs');
	var winston = require('winston');

	var defaultLogger = new(winston.Logger)({
		transports: [
			// new(winston.transports.Console)(), //just for debugging
			new(winston.transports.File)({
				filename: '/var/log/mission.log',
				handleExceptions: true
			})
		],
		exitOnError: true
	});

	var logsFolder = '/var/log/mission';
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