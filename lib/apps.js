/*
 * apps.js
 *
 * returns a apps.Service by name for launcher to use
 *
 * includes apps.Service at bottom
 * 
 */

var fs = require('fs'),
	path = require('path');

var config = require('../config');

var storage = require('./storage');

var logger = require('./logHandler').defaultLogger;

//cache of services
var data = {};


//list all the available apps
function list() {
	var apps = fs.readdirSync(config.appfolder);
	return apps;
}

// get the mission file of an app
//returns false if missionfile does not exist
function missionFile(name) {
	logger.debug('getting MissionFile for app: ' + name);
	var service;
	try {
		var mtime = missionFileMtime(name);
	} catch(e) {
		//fail if we can't get the mtime (app not found)
		logger.warn('could not find app "%s"', name);

		logger.debug('removing data storage for app %s', name);
		storage.delete(name);

		return false;
	}
	if(data[name] && +data[name].mtime == +mtime) {
		//missionfile exists in our cache and is up to date
		logger.debug('found app ' + name + ' in apps.js cache');
		service = data[name].service;
	} else {
		//get a new instance of the missionfile
		// var missionFile = fs.readFileSync(missionFilePath(name));
		// var obj = JSON.parse(missionFile);
		// service = new Service({
		// 	name: obj.name, //maybe not even have a `name` field?
		// 	hostname: obj.hostname,
		// 	start: obj.start
		// });
		service = Service.parseMissionFile(missionFilePath(name));
		
		data[name] = {
			mtime: mtime,
			service: service,
		};

		//preserve attr field if it exists
		if(!data[name].attr) {
			data[name].attr = {};
		}

	}
	return service;
}

function missionFilePath(name) {
	var filepath = path.join(config.appfolder, name, 'MissionFile');
	if(fs.existsSync(filepath)) {
		return filepath;
	} else {
		throw new Error('MissionFile doesn\'t exist for ' + name);
	}
}

function missionFileMtime(name) {
	var stats = fs.statSync(missionFilePath(name));
	return stats.mtime;
}

module.exports = function(name) {
	if (typeof name === 'undefined') {
		return list();
	} else {
		return missionFile(name);
	}
};

/*
 * classes
 */

//object that defines an app, based off a MissionFile in the
//root directory of the app
function Service(opt) {
	opt = opt || {};
	this.name = opt.name;
	this.hostname = opt.hostname;
	this.start = opt.start; // this should be different?
	this.static = opt.static;
}

Service.parseMissionFile = function(filename) {
	var serviceConfig = fs.readFileSync(filename);
	var obj = JSON.parse(serviceConfig);
	return new Service({
		name: obj.name,  //maybe not even have a `name` field?
		hostname: obj.hostname,
		start: obj.start,
		static: obj.static
	});
};

//temporary
Service.prototype.attr = function(key, value) {
	if(typeof key === 'undefined') {
		//get all
		return data[this.name].attr;
	} else if(typeof value === 'undefined') {
		//get
		return data[this.name].attr[key];
	} else {
		//set
		logger.debug('apps.js %s: setting %s=%s', this.name, key, value);
		data[this.name].attr[key] = value;
	}
}

//permanent
Service.prototype.data = function(key, value) {
	//TODO: cache
	if(typeof key === 'undefined') {
		//get all
		return storage.get('apps/' + this.name) || {};
	} else if(typeof value === 'undefined') {
		//get
		var obj = storage.get('apps/' + this.name) || {};
		return obj[key];
	} else {
		//set
		logger.debug('apps.js %s: saving %s=%s', this.name, key, value);
		var obj = storage.get('apps/' + this.name) || {};
		obj[key] = value;
		storage.set('apps/' + this.name, obj);
	}
}

module.exports.Service = Service;