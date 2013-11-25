'use strict';

var fs = require('fs'),
	path = require('path');

var logger = require('./logHandler').defaultLogger;

var config = require('../config');

var storePath = path.join(config.missionfolder, 'store');

function getStorage(name) {
	try {	
		var file = fs.readFileSync(path.join(storePath, name + '.json'));
		return JSON.parse(file);
	} catch(e) {
		return null;
	}
}

function setStorage(name, obj) {
	fs.writeFileSync(path.join(storePath, name + '.json'), JSON.stringify(obj));
	return true;
}

module.exports.get = getStorage;
module.exports.set = setStorage;
