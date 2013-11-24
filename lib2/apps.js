/*
 * apps.js
 *
 * returns a apps.Service by name for launcher to use
 * 
 */

var fs = require('fs'),
	path = require('path');

var config = require('../config');

var logger = require('./logHandler').defaultLogger;

//TODO: add temporary info on each app + cache services
var data = {};


//list all the available apps
function list() {
	var apps = fs.readdirSync(config.appfolder);
	return apps;
}

// get the mission file of an app
function missionFile(name) {
	logger.debug('getting MissionFile for app: ' + name);
	var service;
	var mtime = missionFileMtime(name);
	if(data[name] && +data[name].mtime == +mtime) {
		//missionfile exists in our cache and is up to date
		logger.debug('found app ' + name + ' in apps.js cache');
		service = data[name].service;
	} else {
		//get a new instance of the missionfile
		var missionFile = fs.readFileSync(missionFilePath(name));
		var obj = JSON.parse(missionFile);
		service = new Service({
			name: obj.name,
			hostname: obj.hostname,
			start: obj.start
		});
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

// var apps = list();
// for(var i = 0; i < apps.length; i++) {
// 	console.log(missionFile(apps[i]));
// }


//object that defines an app, based off a MissionFile in the
//root directory of the app
function Service(opt) {
	opt = opt || {};
	this.name = opt.name;
	this.hostname = opt.hostname;
	this.start = opt.start; // this should be different?
}

Service.parseMissionFile = function(filename) {
	var serviceConfig = fs.readFileSync(filename);
	var obj = JSON.parse(serviceConfig);
	return new Service({
		name: obj.name,
		hostname: obj.hostname,
		start: obj.start
	});
};

Service.prototype.attr = function(key, value) {
	if(typeof value === 'undefined') {
		//get
		return data[this.name].attr[key];
	} else {
		//set
		logger.debug('apps.js %s: setting %s=%s', this.name, key, value);
		data[this.name].attr[key] = value;
	}
}


module.exports = function(name) {
	if (typeof name === 'undefined') {
		return list();
	} else {
		return missionFile(name);
	}
};

module.exports.Service = Service;