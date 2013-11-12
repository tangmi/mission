'use strict';

var path = require('path');

var homedir = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'];

module.exports = {
	missionfolder: path.join(homedir, '.mission'),
	appfolder: path.join(homedir, 'app'),
	logfolder: path.join(homedir, 'log'),
	pidfolder: path.join(homedir, 'pid'),
};