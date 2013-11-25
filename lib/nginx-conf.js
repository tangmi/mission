/*
 * nginx-conf.js
 *
 * this file does everything nessecary to reload an nginx config set
 *
 */

var fs = require('fs'),
	path = require('path');

var hogan = require('hogan.js');
var template = loadTemplate('nginx-site');

var logger = require('./logHandler').defaultLogger;

var apps = require('./apps');

var nginxEnabledSitesPath = require('../config').nginxfolder;

function loadTemplate(name) {
	var templateBasePath = __dirname + '/../templates';
	var templateRaw = fs.readFileSync(path.join(templateBasePath, name));
	return hogan.compile(templateRaw.toString());
}

function renderTemplate(service) {
	return template.render({
		currtime: new Date(),
		appname: service.name,
		hostname: service.hostname,
		port: service.attr('port')
	});
}

function refreshList(arr) {
	logger.info('refreshing apps: [%s]', arr.join(','));
	for(var i = 0; i < arr.length; i++) {
		refreshApp(arr[i]);
	}
}

function refreshApp(name) {
	var service = apps(name);
	if(service) {
		removeConf(name);
		var tmpl = renderTemplate(service);
		var confPath = path.join(nginxEnabledSitesPath, name);
		logger.info('write nginx config for %s', name);
		fs.writeFileSync(confPath, tmpl);
	} else {
		logger.warn('app "%s" does not exist!', name);
	}
}

function removeConf(name) {
	try {
		logger.info('remove config for %s', name);
		fs.unlinkSync(path.join(nginxEnabledSitesPath, name));
	} catch(e) {
		logger.warn('nginx configuration for %s does not exist!', name);
	}
}

function reloadNginx() {
	var cmd = 'nginx -s reload';
	require('child_process').exec(cmd, function(error, stdout, stderr) {
		if(error) {
			logger.error('could not reload nginx (cmd=`%s`)', cmd);
		}
		if(stdout) {
			logger.info(stdout);
		}
		if(stderr) {
			logger.error(stderr);
		}
	});
}

module.exports.refresh = refreshList;
module.exports.remove = removeConf;
module.exports.reload = reloadNginx;