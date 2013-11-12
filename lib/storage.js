'use strict';

var path = require('path');

// uses https://github.com/grimen/node-document-storage-fs
var Storage = require('node-document-storage-fs');

var config = require('../config');

var storage = new Storage(path.join(config.missionfolder, 'store'));

module.exports = storage;