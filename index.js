
var   extend 		= require('extend')
	, _ 			= require('underscore')
	, chalk 		= require('chalk')
	, nodemailer 	= require('nodemailer')
	, uuid 			= require('uuid')
	;

module.exports = function(options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

/** generates a server token **/
function generateToken(){
	var token = uuid.v4();
	console.log("Generate token: ", token);
	return token;
}

function Construct(options, callback) {
	var apos = options.apos;
	var app = options.app;

	if (!options.sendto) {
		console.error(chalk.red('WARNING: you must configure the sendto adress in the contactmail section.'));
	}
	if (!options.mailer) {
		console.error(chalk.red('WARNING: you must configure mailer.'));
	}
	var self = this;
	self._apos = apos;
	self._app = app;
	self.options = options;
	
	var sendto = options.sendto;
	var servertoken = generateToken();
	
	self._apos.mixinModuleAssets(self, 'contactmail', __dirname, options);

	// resources
	self.pushAsset('script', 'content', { when: 'always', data: {foo: 'bar'} });
	self.pushAsset('script', 'jquery.serializeJSON/jquery.serializejson.min', { when: 'always' });
	self._apos.pushGlobalCallWhen('always', 'AposContactmail(?, ?)', servertoken, options.text );
	
	self.widget = false;
	
	self.tokenlookup = {}
	
	app.get('/apos-contactmail/client-token', function(req, res) {
		if(req.headers['x-server-token'] != servertoken){
			res.statusCode = 401;
			return res.send({error: 'invalid servertoken'});
		}
		var clienttoken = generateToken();
		req.session.contactmail = {
			token: clienttoken
		};
		req.session.save();
		console.log(req.session);
		res.statusCode = 200;
		return res.json({token: clienttoken});
	});
	
	app.post('/apos-contactmail/send', function(req, res) {
		console.log("sessionID", req.sessionID); // do something with thw sessionid
		if (self._apos._aposLocals.offline) {
			res.statusCode = 404;
			return res.send({error: 'offline'});
		}
		
		if (!self.options.sendto || !self.options.mailer) {
			res.statusCode = 500;
			return res.send({error: 'insufficient configuration.'});
		}
		
		if(req.headers['x-server-token'] != servertoken){
			res.statusCode = 401;
			return res.send({error: 'invalid servertoken'});
		}
		var clienttoken = req.headers['x-client-token'];
		if(!req.session || !req.session.contactmail || !req.session.contactmail.token){
			res.statusCode = 401;
			return res.send({error: 'invalid session'});
		}
		if( clienttoken != req.session.contactmail.token){
			res.statusCode = 401;
			return res.send({error: 'invalid token'});
		}
		
		// sending mail ... 
			
		self.options.mailer.sendMail({
			from: req.body.email || 'apostrophe-contactmail',
			to: self.options.sendto,
			subject: (self.options.subjectprefix || '')+ req.body.subject || '',
			text: req.body.message
		}, function(err, info){
			if(err){
				console.log(err);
				res.statusCode = 500;
				return res.send({error: err.code});
			}
			res.statusCode = 200;
			return res.json({status: 'ok', response: info});
		});
		
		
	});

	return setImmediate(function() { return callback(null); });
}
