
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
	'academy',	
	'fortress'];

//var common = require('common-node')
var url = require('url');
var http = require('http');
var request = require('request');

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
	getSynonyms(query.word, function(synonyms){
		
		if(!synonyms){
			error("unrecognised word galaxy");	
			return;		
		}
	
		try{			
			addResults(synonyms, query.nested, function(){
				body.result = "success world";				
				res.end(JSON.stringify(body, null, 4));	
				recordHit(body);
			});		

		
		}catch(err){		
			error("unknown error planet");	
			return;		
		}
		
		
		
		
	});
	


	//}).listen(1337, 'localhost'); // for local debuggin
}).listen(process.env.PORT); // for production

function addResults(synonyms, shouldNest, callback){	
	
	if(synonyms){
		for (var i = 0; i < synonyms.length; i++) {	
	
			var randomNumber = Math.floor(Math.random()*tails.length);
			var tail = tails[randomNumber];
			var synonym = synonyms[i];		
				
			var phrase = synonym + ' ' + tail;
			body.worlds.push(phrase);		
						
		}
	}
			
	// should we do a nested call?
	if(shouldNest && synonyms){
		
		for (var i = 0; i < synonyms.length; i++) {	
			var synonym = synonyms[i];	
						
			getSynonyms(synonym, function(nestedSynonyms){

					if(i >= synonyms.length-1){
						addResults(nestedSynonyms, false, callback);
					}else{
						addResults(nestedSynonyms, false);						
					}
			});			
		} 
	}else{
		if(callback)
			callback();
	}
		
}

function error(message){
	body.result = "fail land";
	body.reason = message;
	responseCallback.end(JSON.stringify(body, null, 4));
	recordHit(body);
}

console.log('Server running');

function getSynonyms(word, callback){
	
	try{
		
		// smash the thesaurus API
		var randomNumber = Math.floor(Math.random()*apiKeys.length);
		var thesaurusUrl = "http://words.bighugelabs.com/api/2/" + apiKeys[randomNumber] + "/" + word + "/json";
					
		var resultsStr = getResponseFromFile(word);
	
		if(resultsStr!=null){
			var jsonResponse = JSON.parse(resultsStr);
			callback(jsonResponse.noun.syn);
		}else{	
			console.log("cache miss");
			
			request(thesaurusUrl, function(error, response, body) {
			  console.log(body);
  				resultsStr = response.body;
  				writeResponseToFile(word, resultsStr);	
				var jsonResponse = JSON.parse(resultsStr);
				callback(jsonResponse.noun.syn);				
			});			
		}										
		
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

function recordHit(body){
	try{
		
		var line = "input: " + body.input + ", ";
		line += "result: " + body.result + ", ";
		line += "count: " + body.worlds.length + ", ";
		line += "time: " + getDateTime();
		line += '\r\n';
		
		var fs = require('fs');
								
		fs.appendFileSync("log.txt", line);
	}catch(err){		
	}	
}

function getDateTime(){
	var currentdate = new Date(); 
	var datetime =  currentdate.getDate() + "/"
	                + (currentdate.getMonth()+1)  + "/" 
	                + currentdate.getFullYear() + " @ "  
	                + currentdate.getHours() + ":"  
	                + currentdate.getMinutes() + ":" 
	                + currentdate.getSeconds();
					
					return datetime;
}

