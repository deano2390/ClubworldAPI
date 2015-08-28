
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
		
	// make sure we palm off any favicon requests
	if (req.url === '/favicon.ico') {
	    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
	    res.end();
	    console.log('favicon requested');
	    return;
	}
		
	responseCallback = res;
	
	// build the response object
	body = {};
	body.result = {};
	body.worlds = [];	
	var query = url.parse(req.url, true).query;		
	
	if(query==undefined) return;
	
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
	
	// reset the queues
	runningQueries = [];
	outstandingQueries = [];
	
	console.log('query: ' + query.word);
	getSynonyms(query.word, function(input, synonyms){
		
		if(!synonyms){
			error("unrecognised word galaxy");	
			return;		
		}
	
		try{			
			
			console.log('first callback: ' + synonyms.length);
			
			addResults(input, synonyms, query.nested, function(){
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



var runningQueries = [];
var outstandingQueries = [];

function addResults(inputWord, synonyms, shouldNest, addResultsCallback){		
	
	if(synonyms){
		for (var i = 0; i < synonyms.length; i++) {	
	
			var randomNumber = Math.floor(Math.random()*tails.length);
			var tail = tails[randomNumber];
			var synonym = synonyms[i];		
				
			var phrase = synonym + ' ' + tail;
			
			if(body.worlds.indexOf(phrase) < 0){			// only add if not already present
				body.worlds.push(phrase);		
			}
			
			if(shouldNest){
				outstandingQueries.push(synonym);
			}
						
		}
	}
	
	// was this call in the queue? remove it if so
	var indexInQueue = runningQueries.indexOf(inputWord)
	if(indexInQueue > -1){
		runningQueries.splice(indexInQueue, 1);
	}
			
	// should we do a nested call?
	if(shouldNest && outstandingQueries.length > 0){	
		
		while(outstandingQueries.length > 0){
			
			var synonym = outstandingQueries.pop();				
			runningQueries.push(synonym);		
			
			getSynonyms(synonym, function(input, nestedSynonyms){
				addResults(input, nestedSynonyms, false, addResultsCallback);					
			});			
		} 
	}
	
	// no more queries running or queued, so we callback
	if(runningQueries.length <= 0 && outstandingQueries.length <=0){
		if(addResultsCallback)
			addResultsCallback();
	}
		
}

function error(message){
	body.result = "fail land";
	body.reason = message;
	responseCallback.end(JSON.stringify(body, null, 4));
	recordHit(body);
}

console.log('Server running');

function getSynonyms(word, synonymCallback){
	
	try{									
		getResponseFromFile(word, function(resultsStr){
			if(resultsStr){
				console.log("cache hit");
				var jsonResponse = JSON.parse(resultsStr);
				synonymCallback(word, jsonResponse.noun.syn);
			}else{	
				getFromWeb(word, synonymCallback);			
			}		
		});						
		
	}catch(err){				
		synonymCallback(word, null);		
	}
}

function getFromWeb(word, webCallback){
	console.log("cache miss");
	
	// smash the thesaurus API
	var randomNumber = Math.floor(Math.random()*apiKeys.length);
	var url = "http://words.bighugelabs.com/api/2/" + apiKeys[randomNumber] + "/" + word + "/json";
	
	request(url, function(error, response, body) {
	  	
		var result;
		
		try{
			//console.log(body);
			resultsStr = response.body;
			writeResponseToFile(word, resultsStr);	
			var jsonResponse = JSON.parse(resultsStr);
			result = jsonResponse.noun.syn;	
		}catch(err){}
		
		webCallback(word, result);			
		
	});	
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

function getResponseFromFile(key, fileCallback){	
	
	try{
		var fs = require('fs');
		fs.readFile("cache/" + key + ".json", 'utf8', function (err,data) {
		  if (err) {
			  fileCallback();
		  }else{
			  fileCallback(data.toString());
		  }

		});
	}catch(err){
		
	}
	
	/*try{
		
		var contents = fs.readFileSync("cache/" + key + ".json").toString();		
		return contents;
	}catch(err){
		
	}*/
}

function recordHit(body){
	
	console.log('recordHit ' + body.worlds.length);
	
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

