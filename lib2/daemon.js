
/*
 * TODO:
 * * save enabled/disabled state
 * * 
 */

var storage = require('./storage');

storage.set('poop', {'hello': 'world'}, function(save) {
	console.log(save);
	storage.get('poop', function(result) {
		console.log(result);
	})
});
