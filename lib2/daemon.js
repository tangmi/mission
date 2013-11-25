
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

		if(typeof cb === 'function') {
			cb();
		}
	});
}

start();