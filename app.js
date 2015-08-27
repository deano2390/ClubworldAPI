
var apiKeys = ["f36c188ffe9619d86d057b72d946c56d", "5dd141edf27e5ff3dd4fa0583d7a6d2e"];

var tails = [
	'world', 
	'zone',
	'land', 
	'planet', 
	'club', 
	'galaxy', 
	'universe', 
	'district', 
	'area', 
	'embassy', 
	'bureau', 
	'agency', 
	'society', 
	'guild', 
	'association', 
	'lodge', 
	'station', 
	'garrison', 
	'fort', 
	'base', 
	'encampment',
	'squad',
	'gang',
	'parlour',
	'sector',
	'realm',
	'province',
	'kingdom',
	'empire',
	'quarter',
	'dynasty',	
	'fortress'];

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
	var synonyms = getSynonyms(query.word);
	
	if(!synonyms){
		error("unrecognised word galaxy");	
		return;		
	}
	
	try{			
		addResults(synonyms, query.nested);		
		body.result = "success world";
		
	}catch(err){		
		error("unknown error planet");	
		return;		
	}
		
	res.end(JSON.stringify(body, null, 4));


	//}).listen(1337, 'localhost'); // for local debuggin
}).listen(process.env.PORT); // for production

function addResults(synonyms, shouldNest){	
	
	for (i = 0; i < synonyms.length; i++) {	
	
		var randomNumber = Math.floor(Math.random()*tails.length);
		var tail = tails[randomNumber];
		var synonym = synonyms[i];		
				
		var phrase = synonym + ' ' + tail;
		body.worlds.push(phrase);		
						
	}
			
	// should we do a nested call?
	if(shouldNest){
		
		for (i2 = 0; i2 < synonyms.length; i2++) {	
			var synonym = synonyms[i2];				
			var nestedSynonyms = getSynonyms(synonym);
			if(nestedSynonyms){
				addResults(nestedSynonyms, false);
			} 
		} 
	}
		
}

function error(message){
	body.result = "fail land";
	body.reason = message;
	responseCallback.end(JSON.stringify(body, null, 4));
}

console.log('Server running');

function getSynonyms(word){
	
	try{
		
		// smash the thesaurus API
		var thesaurusUrl = "http://words.bighugelabs.com/api/2/" + apiKeys[0] + "/" + word + "/json";
					
		var resultsStr = getResponseFromFile(word);
	
		if(resultsStr==null){	
			console.log("cache miss");
			response = request('GET', thesaurusUrl);			
			resultsStr = response.body;
			writeResponseToFile(word, resultsStr);			
		}						
				
		var jsonResponse = JSON.parse(resultsStr);
		return jsonResponse.noun.syn;
		
	}catch(err){				
		return;		
	}
}

function writeResponseToFile(key, value){
	try{
		
		var fs = require('fs');
		
		if (!fs.existsSync("cache")){
		    fs.mkdirSync("cache");
		}
				
		fs.writeFileSync("cache/" + key + ".json", value);
	}catch(err){		
	}
}

function getResponseFromFile(key){
	try{
		var fs = require('fs');
		var contents = fs.readFileSync("cache/" + key + ".json").toString();
		console.log("cache hit");
		return contents;
	}catch(err){
		
	}
}

