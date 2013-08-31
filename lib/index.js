'use strict';

(function(exports) {
	var fs = require('fs'),
	path = require('path');

	function init(options) {
		var cwd = process.cwd();
		var confFilePath = path.join(cwd, '.mission');
		fs.openSync(confFilePath, 'w');
		var defaultConf = fs.readFileSync(path.join(__dirname, '..', 'data', 'default.mission'));
		fs.writeFileSync(confFilePath, defaultConf);
		console.log('Initialized basic mission configuration at', confFilePath);
	}

	exports.init = init;
})(module.exports);