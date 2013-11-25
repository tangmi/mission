
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
load();

function load() {
	logger.info('loading enabled-sites persistence...')
	enabledSites = storage.get('enabled-sites') || [];

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

	save();
}

function save() {
	storage.set('enabled-sites', enabledSites);
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
	var dirtySites = storage.get('dirty') || [];
	for (var i = 0; i < dirtySites.length; i++) {
		var siteName = dirtySites[i];
		var service = apps(siteName);
		launcher.restart(service);
	}

	nginx.refresh(dirtySites);
	nginx.reload();
}

function addDirty(name) {
	var dirtySites = storage.get('dirty') || [];
	dirtySites.push(name);
	storage.set('dirty', dirtySites);
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