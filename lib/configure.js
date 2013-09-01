'use strict';

(function(exports) {

	var path = require('path');
	var storage = require('node-persist');

	var missionFolderPath = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.mission');

	storage.initSync({
		dir: missionFolderPath,
		parse: JSON.parse,
		stringify: function(json) {
			return JSON.stringify(json, null, 2);
		}
	});

	var defaultConfig = {
		paths: {
			"sites-enabled": "/etc/nginx/sites-enabled"
		}
	};

	// deferred app startup/shutdown queue
	exports.queue = {
		read: function() {
			var queue = storage.getItem('queue') || [];
			storage.setItem('queue', []);
			return queue;
		},
		add: function(item) {
			var queue = storage.getItem('queue') || [];
			if (queue.indexOf(item) === -1) {
				queue.push(item);
			}

			storage.setItem('queue', queue);
		}
	};

	exports.set = function(key, value) {
		var config = storage.getItem('config') || defaultConfig;
		addValueToConfig(config, key, value);
		storage.setItem('config', config);
	};

	exports.get = function(key) {
		var config = storage.getItem('config') || defaultConfig;
		return getValueFromConfig(config, key);
	};

	exports.list = function() {
		var config = storage.getItem('config') || defaultConfig;
		return listValuesFromConfig(config);
	};

	function addValueToConfig(obj, key, value) {
		var path = key.split(".");

		var i,
			tmp = obj;
		for (i = 0; i < path.length - 1; i++) {
			if (!tmp[path[i]]) {
				tmp[path[i]] = {}
			}
			tmp = tmp[path[i]];
		}
		tmp[path[i]] = value;
	}

	function getValueFromConfig(obj, key) {
		var path = key.split(".");

		var i,
			tmp = obj;
		for (i = 0; i < path.length; i++) {
			tmp = tmp[path[i]];
			if (!tmp) {
				return '';
			}
		}
		return tmp;
	}

	function listValuesFromConfig(obj) {
		return _listValuesFromConfigRecurse(obj, '');
	}

	function _listValuesFromConfigRecurse(root, base) {
		var output = '';
		for (var key in root) {
			if (root.hasOwnProperty(key)) {
				var value = root[key];
				if (typeof value !== 'object') {
					output += base + '.' + key + '=' + value + '\n';
				} else {
					output += _listValuesFromConfigRecurse(value, key);
				}
			}
		}
		return output;
	}


})(module.exports);