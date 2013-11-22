var fs = require('fs');

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

function Process(opt) {
	opt = opt || {};
	this.port = opt.port;
	this.service = opt.service;
}

module.exports.Service = Service;
module.exports.Process = Process;