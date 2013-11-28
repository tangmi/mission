'use strict';

var fs = require('fs'),
	path = require('path');

var logger = require('./logHandler').defaultLogger;

var config = require('../config');

var storePath = path.join(config.missionfolder, 'store');

function storageFilePath(name) {
	return path.join(storePath, name + '.json');
}

function getStorage(name) {
	try {	
		var file = fs.readFileSync(storageFilePath(name));
		return JSON.parse(file);
	} catch(e) {
		return null;
	}
}

function setStorage(name, obj) {
	ensureDirExists(path.dirname(storageFilePath(name)));
	fs.writeFileSync(storageFilePath(name), JSON.stringify(obj));
	return true;
}

function deleteStorage(name) {
	try {
		fs.unlinkSync(storageFilePath(name));
	} catch(e) {
		logger.debug('%s already deleted', name);
	}
}

module.exports.get = getStorage;
module.exports.set = setStorage;
module.exports.delete = deleteStorage;
module.exports.mtime = function(name) {
	var stats = fs.statSync(storageFilePath(name));
	return stats.mtime;
}


//copied from config.js
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