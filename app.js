
var tails = ['world', 'zone', 'land', 'planet', 'club', 'galaxy', 'universe', 'district', 'area', 'embassy', 'bureau', 'agency', 'society', 'guild', 'association', 'lodge', 'station', 'garrison', 'fort', 'base', 'encampment', 'fortress'];

//var common = require('common-node')
var url = require('url');
var http = require('http');
var request = require('sync-request');

var body, responseCallback;

http.createServer(function(req, res) {			
		
	responseCallback = res;
	
	// build the response object
	body = {};
	body.worlds = [];
	
	var query = url.parse(req.url, true).query;		
	
	if(query.word==null){
		error("missing input zone");	
		return;		
	}
		
	if(query.word.length==0){
		error("invalid input zone");	
		return;		
	}
	
	body.input = query.word;
	
	// smash the thesaurus API
	var thesaurusUrl = "http://words.bighugelabs.com/api/2/5dd141edf27e5ff3dd4fa0583d7a6d2e/" + query.word + "/json";
	
	var response = request('GET', thesaurusUrl);			
	
	try{	
		
		if(response.statusCode != 200){
			error("unrecognised word galaxy");	
			return;		
		}
		
		var responseStr = response.getBody();		
		
		var jsonResponse = JSON.parse(responseStr);
		var heads = jsonResponse.noun.syn;

		for (i = 0; i < heads.length; i++) {
			
			var randomNumber = Math.floor(Math.random()*tails.length);
			var tail = tails[randomNumber];
			var head = heads[i];
			var phrase = head + ' ' + tail;
			body.worlds.push(phrase);
			
		}
		
		body.result = "success world";
		
	}catch(err){		
		error("unknown error planet");	
		return;		
	}
		
	res.end(JSON.stringify(body, null, 4));


//	}).listen(1337, 'localhost'); // for local debuggin
}).listen(process.env.PORT); // for production

function error(message){
	body.result = "fail land";
	body.reason = message;
	responseCallback.end(JSON.stringify(body, null, 4));
}

console.log('Server running');

function get(url) {
  return new (require('common-node').httpclient.HttpClient)({
    method: 'GET',
      url: url
    }).finish().body.read().decodeToString();
}