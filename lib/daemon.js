
/*
 * TODO:
 * * save enabled/disabled state
 * * 
 */

var fs = require('fs'),
	path = require('path');

var storage = require('./storage'),
	apps = require('./apps'),
	launcher = require('./launcher'),
	nginx = require('./nginx-conf');

var logger = require('./logHandler').defaultLogger;

var config = require('../config');

/*
 * enabled sites persistence
 */

var enabledSites = null;

function load() {

	var storePath = path.join(config.missionfolder, 'store');

	var files = [];
	fs.readdirSync(storePath).forEach(function(item) {
		item = item.split('.');
		item.pop();
		var appname = item.join('.');
		var service = apps(appname);
		if(service && service.data('enabled') == true) {
			files.push(appname);
		}
	});

	logger.info('enabled sites: [%s]', files.join(','));
	
	var newEnabledSites = [];
	var allSites = apps();

	for(var i = 0; i < files.length; i++) {
		var appname = files[i];
		if(allSites.indexOf(appname) !== -1) {
			newEnabledSites.push(appname);
		} else {
			//clean up confs for nginx
			logger.debug('pruning site from enabled-sites: %s', appname);
			nginx.remove(appname);
		}
	}

	logger.info('loading enabled-sites persistence...')

	enabledSites = newEnabledSites;

}

/*
 * daemon functions
 */

function start() {
	load();

	for(var i = 0; i < enabledSites.length; i++) {
		var siteName = enabledSites[i];
		launcher.start(apps(siteName));
	}
	
	nginx.refresh(enabledSites);
	nginx.reload();

}

function stop() {
	launcher.stopAll();
	monitoring.stop();
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
start();
stop();