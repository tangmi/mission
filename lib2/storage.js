'use strict';

var path = require('path');

var logger = require('./logHandler').defaultLogger;


// uses https://github.com/grimen/node-document-storage-fs
var Storage = require('node-document-storage-fs');

var config = require('../config');
var storage = new Storage(path.join(config.missionfolder, 'store'));

function getStorage(name, cb) {
	storage.get(name, function(errors, results) {
		cb(results[0]);
	});
}

function setStorage(name, obj, cb) {
	storage.set(name, obj, function(errors, results) {
		cb(results[0]);
	});
}

module.exports.get = function(key, cb) {
	if(typeof cb !== 'function') {
		cb = function() {};
	}
	getStorage(key, cb);
}

module.exports.set = function(key, value, cb) {
	if(typeof cb !== 'function') {
		cb = function() {};
	}
	setStorage(key, value, cb);
}