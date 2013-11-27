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
	fs.writeFileSync(storageFilePath(name), JSON.stringify(obj));
	return true;
}

function deleteStorage(name) {
	fs.unlinkSync(storageFilePath(name));
}

module.exports.get = getStorage;
module.exports.set = setStorage;
module.exports.delete = deleteStorage;
module.exports.mtime = function(name) {
	var stats = fs.statSync(storageFilePath(name));
	return stats.mtime;
}