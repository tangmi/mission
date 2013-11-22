var fs = require('fs'),
	path = require('path');

var Service = require('./structs').Service;

var config = require('../config');

//list all the available apps
function list() {
	var apps = fs.readdirSync(config.appfolder);
	return apps;
}

// get the mission file of an app
function missionFile(name) {
	var missionFile = fs.readFileSync(path.join(config.appfolder, name, 'MissionFile'));
	var obj = JSON.parse(missionFile);
	return new Service({
		name: obj.name,
		hostname: obj.hostname,
		start: obj.start
	});
}

// var apps = list();
// for(var i = 0; i < apps.length; i++) {
// 	console.log(missionFile(apps[i]));
// }

module.exports = function(name) {
	if (typeof name === 'undefined') {
		return list();
	} else {
		return missionFile(name);
	}
};