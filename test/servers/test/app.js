// simple example server

var port = process.env.PORT || 3000;

var app = require('express')();

app.get('/', function(req, res) {
	res.send(200);
});

app.listen(port)

console.log('simple example server is listening on port: ' + port);