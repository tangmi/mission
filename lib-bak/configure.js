'use strict';

(function(exports) {

	var path = require('path');
	var storage = require('./storage'),
		config = require('../config');

	var defaultConfig = {
		paths: {
			"sites-enabled": "/etc/nginx/sites-enabled",
			"app-directory": config.appfolder
		}
	};

	//this is pretty fragile, we dont wait for this to load
	var configuration, queue;
	storage.get('config', function(err, results) {
		configuration = results[0] || defaultConfig;
		sync('config', configuration);
	});
	storage.get('queue', function(err, results) {
		queue = results[0] || [];
		sync('queue', queue);
	});

	// deferred app startup/shutdown queue
	exports.queue = {
		read: function() {
			var out = queue;
			queue = [];
			sync('queue', queue);
			return out;
		},
		add: function(item, cb) {
			if (queue.indexOf(item) === -1) {
				queue.push(item);
			}
			sync('queue', queue);
		}
	};

	exports.set = function(key, value) {
		addValueToConfig(config, key, value);
		sync('config', configuration);
	};

	exports.get = function(key) {
		sync('config', configuration);
		return getValueFromConfig(configuration, key);
	};

	exports.list = function() {
		return listValuesFromConfig(configuration);
	};

	function sync(name, obj, cb) {
		//syncs config with storage
		storage.set([name], [obj], function(err, results) {
			console.log(err + ":::" + results);
			if (typeof cb === 'function') {
				cb(err, results);
			}
		});
	}

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