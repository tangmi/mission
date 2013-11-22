'use strict';

var path = require('path');

var basedir = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'];

//just for testing
basedir = './$HOME';

module.exports = {
	missionfolder: path.join(basedir, '.mission'),
	appfolder: path.join(basedir, 'app'),
	logfolder: path.join(basedir, 'log'),
	pidfolder: path.join(basedir, 'pid'),
};


for (var key in module.exports) {
	if (module.exports.hasOwnProperty(key)) {
		ensureDirExists(module.exports[key]);
	}
}

function ensureDirExists(path) {
	var fs = require('fs'),
		mkdirp = require('mkdirp');

	if (fs.existsSync(path)) {
		var stats = fs.statSync(path);
		if (!stats.isDirectory()) {
			throw new Error('path exists, but is not a directory: ' + path);
		}
	} else {
		mkdirp.sync(path);
	}
}