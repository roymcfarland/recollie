var request = require('request');

var recollie = function(term, callback) {
	request('http://api.usa.gov/recalls/search.json?query=' + term, function(error, response, body){
		if(!error && response.statusCode == 200) {
			var results = JSON.parse(body);
			callback(results);
		}
	});
};

module.exports = recollie;