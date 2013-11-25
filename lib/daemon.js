
/*
 * TODO:
 * * save enabled/disabled state
 * * 
 */

var storage = require('./storage'),
	apps = require('./apps'),
	launcher = require('./launcher'),
	nginx = require('./nginx-conf');

var logger = require('./logHandler').defaultLogger;

/*
 * enabled sites persistence
 */

var enabledSites = null;

function load(cb) {
	logger.info('loading enabled-sites persistence...')
	storage.get('enabled-sites', function(result) {
		enabledSites = result || [];

		logger.info('enabled sites: [%s]', enabledSites.join(','));

		//prune sites that don't exist anymore
		var newEnabledSites = [];
		var allSites = apps();
		for(var i = 0; i < enabledSites.length; i++) {
			if(allSites.indexOf(enabledSites[i]) !== -1) {
				newEnabledSites.push(enabledSites[i]);
			} else {
				//clean up confs for nginx
				nginx.remove(enabledSites[i]);
				logger.debug('pruned site from enabled-sites: %s', enabledSites[i]);
			}
		}
		enabledSites = newEnabledSites;

		save(cb);
	});
}

function save(cb) {
	storage.set('enabled-sites', [enabledSites], function() {
		cb();
	});
}

function appStatus(name) {
	return enabledSites.indexOf(name) !== -1;
}

module.exports.appStatus = appStatus;

/*
 * daemon functions
 */

function start(cb) {
	load(function() {
		for(var i = 0; i < enabledSites.length; i++) {
			var siteName = enabledSites[i];
			launcher.start(apps(siteName));
		}
		
		nginx.refresh(enabledSites);
		nginx.reload();

		if(typeof cb === 'function') {
			cb();
		}
	});
}

function stop(cb) {
	launcher.stopAll();
	monitoring.stop();
	if(typeof cb === 'function') {
		cb();
	}
}

function reloadApps() {
	storage.get('dirty', function(result) {
		var dirtySites = result || [];
		for (var i = 0; i < dirtySites.length; i++) {
			var siteName = dirtySites[i];
			var service = apps(siteName);
			launcher.restart(service);
		}

		nginx.refresh(dirtySites);
		nginx.reload();
	});
}

function addDirty(name, cb) {
	storage.get('dirty', function(result) {
		var dirtySites = result || [];
		dirtySites.push(name);
		storage.set('dirty', [dirtySites], function(done) {
			if(typeof cb === 'function') {
				cb();
			}
		});
	});
}

module.exports.addDirty = addDirty;

process.on("SIGUSR1", reloadApps);
process.once("SIGTERM", stop);

// start the monitoring app (port 9000)
var monitoring = require('../monitoring/index');
monitoring.start();

//testing
// start(function() {
// 	stop();
// });