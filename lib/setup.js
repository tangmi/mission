'use strict';

// this script is in charge of moving files around and creating configs and stuff
// and creating a file so the daemon knows what to do

(function(exports) {
	var fs = require('fs'),
		path = require('path');

	var hogan = require('hogan.js');
	var nginxTemplate = loadTemplate('nginx-site');

	// var logger = require('./logHandler').defaultLogger;

	var configure = require('./configure');

	var sites = configure.get('sites') || {};

	var startPort = 9001;


	function add(serviceName, hostname) {
		//create nginx config
		if (sites[serviceName]) {
			console.log('Updating ' + serviceName + ' on ' + hostname);
		} else {
			console.log('Adding ' + serviceName + ' on ' + hostname);
		}
		sites[serviceName] = {
			"hostname": hostname,
			"enabled": sites[serviceName] && sites[serviceName].enabled || false,
			"port": sites[serviceName] && sites[serviceName].port || findPort(sites)
		};
		console.log('Assigned port: ' + sites[serviceName].port + ' to ' + serviceName);
		configure.set('sites', sites);

		reloadConfigs();
	}

	function remove(serviceName) {
		console.log('Removing ' + serviceName);
		if (sites[serviceName]) {
			delete sites[serviceName];
			configure.set('sites', sites);
			reloadConfigs();
		} else {
			console.log('Site ' + serviceName + ' doesn\'t exist!');
		}
	}

	function enable(serviceName) {
		console.log('Enabling ' + serviceName);
		if (sites[serviceName]) {
			sites[serviceName].enabled = true;
			configure.set('sites', sites);
			reloadConfigs();
		} else {
			console.log('Site ' + serviceName + ' doesn\'t exist!');
		}
	}

	function disable(serviceName) {
		console.log('Disabling ' + serviceName);
		if (sites[serviceName]) {
			sites[serviceName].enabled = false;
			configure.set('sites', sites);
			reloadConfigs();
		} else {
			console.log('Site ' + serviceName + ' doesn\'t exist!');
		}
	}

	function list() {
		var enabled = [];
		var available = [];
		for (var serviceName in sites) {
			if (sites.hasOwnProperty(serviceName)) {
				var site = sites[serviceName];
				available.push(serviceName + ': ' + serviceName + '.' + site.hostname + ' (local port: ' + site.port + ')');
				if (site.enabled) {
					enabled.push(serviceName);
				}
			}
		}

		var output = [];
		output.push('');
		if (enabled.length > 0) {
			output.push('  Enabled sites:');
			output.push('');
			output.push('    ' + enabled.join(','));
			output.push('');
		}
		output.push('  Available sites:');
		output.push('');
		output.push('    ' + available.join('\n    '));
		output.push('');

		return output.join('\n');
	}

	function reloadConfigs() {
		//set nginx config files
		var dirNginx = path.resolve(configure.get('dirs.nginx'));
		console.log('Clearing NginX site configs handled by mission (in: ' + dirNginx + ')');
		cleanNginxSites(dirNginx, sites);
		for (var serviceName in sites) {
			if (sites.hasOwnProperty(serviceName)) {
				var site = sites[serviceName];
				if (site.enabled) {
					console.log('Adding ' + serviceName + ' to sites-enabled');
					var nginxConfig = nginxTemplate.render({
						appname: serviceName,
						hostname: site.hostname,
						port: site.port
					});
					fs.writeFileSync(path.join(dirNginx, serviceName), nginxConfig);
				}
			}
		}
	}

	function cleanNginxSites(dir, sites) {
		for (var serviceName in sites) {
			if (sites.hasOwnProperty(serviceName)) {
				if (fs.existsSync(path.join(dir, serviceName))) {
					// console.log('Deleting config: ' + serviceName)
					fs.unlinkSync(path.join(dir, serviceName))
				}
			}
		}
	}

	function findPort(sites) {
		var assignedPort = startPort;
		var usedPorts = [];

		for (var serviceName in sites) {
			if (sites.hasOwnProperty(serviceName)) {
				var site = sites[serviceName];
				usedPorts.push(site.port);
			}
		}

		while (usedPorts.indexOf(assignedPort) !== -1) {
			assignedPort++;

			if (assignedPort >= 9999) {
				throw new Error('Can\'t find an empty port (9001-999), giving up!');
			}
		}
		return assignedPort;
	}

	function loadTemplate(name) {
		var templateBasePath = __dirname + '/templates';
		var templateRaw = fs.readFileSync(path.join(templateBasePath, name));
		return hogan.compile(templateRaw.toString());
	}

	exports.add = add;
	exports.remove = remove;
	exports.enable = enable;
	exports.disable = disable;
	exports.list = list;

})(module.exports);