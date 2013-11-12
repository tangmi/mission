'use strict';

var hogan = require('hogan.js');
var nginxTemplate = loadTemplate('nginx-site');

function stopApp() {

}

function startApp() {

}

function makeNginxConfig() {
	var nginxConfig = nginxTemplate.render({
		appname: serviceName,
		hostname: site.hostname,
		port: site.port
	});
}