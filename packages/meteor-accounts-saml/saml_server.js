/* globals RoutePolicy, SAML */
/* jshint newcap: false */

if (!Accounts.saml) {
	Accounts.saml = {
		settings: {
			debug: true,
			generateUsername: false,
			providers: []
		}
	};
}

var fiber = Npm.require('fibers');
var connect = Npm.require('connect');
RoutePolicy.declare('/_saml/', 'network');

Meteor.methods({
	samlLogout: function(provider) {
		// Make sure the user is logged in before initiate SAML SLO
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}
		var samlProvider = function(element) {
			return (element.provider === provider);
		};
		var providerConfig = Accounts.saml.settings.providers.filter(samlProvider)[0];

		if (Accounts.saml.settings.debug) {
			console.log('Logout request from ' + JSON.stringify(providerConfig));
		}
		// This query should respect upcoming array of SAML logins
		var user = Meteor.users.findOne({
			_id: Meteor.userId(),
			'services.saml.provider': provider
		}, {
			'services.saml': 1
		});
		var nameID = user.services.saml.nameID;
		var sessionIndex = user.services.saml.idpSession;
		nameID = sessionIndex;
		if (Accounts.saml.settings.debug) {
			console.log('NameID for user ' + Meteor.userId() + ' found: ' + JSON.stringify(nameID));
		}

		var _saml = new SAML(providerConfig);

		var request = _saml.generateLogoutRequest({
			nameID: nameID,
			sessionIndex: sessionIndex
		});

		// request.request: actual XML SAML Request
		// request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse

		Meteor.users.update({
			_id: Meteor.userId()
		}, {
			$set: {
				'services.saml.inResponseTo': request.id
			}
		});

		var _syncRequestToUrl = Meteor.wrapAsync(_saml.requestToUrl, _saml);
		var result = _syncRequestToUrl(request.request, 'logout');
		if (Accounts.saml.settings.debug) {
			console.log('SAML Logout Request ' + result);
		}


		return result;
	}
});

Accounts.registerLoginHandler(function(loginRequest) {
	if (!loginRequest.saml || !loginRequest.credentialToken) {
		return undefined;
	}

	var loginResult = Accounts.saml.retrieveCredential(loginRequest.credentialToken);
	if (Accounts.saml.settings.debug) {
		console.log('RESULT :' + JSON.stringify(loginResult));
	}

	if (loginResult === undefined) {
		return {
			type: 'saml',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'No matching login attempt found')
		};
	}

	if (loginResult && loginResult.profile && loginResult.profile.email) {
		var user = Meteor.users.findOne({
			'emails.address': loginResult.profile.email
		});

		if (!user) {
			var newUser = {
				name: loginResult.profile.cn || loginResult.profile.username,
				active: true,
				globalRoles: ['user'],
				emails: [{
					address: loginResult.profile.email,
					verified: true
				}]
			};

			if (Accounts.saml.settings.generateUsername === true) {
				var username = RocketChat.generateUsernameSuggestion(newUser);
				if (username) {
					newUser.username = username;
				}
			}

			var userId = Accounts.insertUserDoc({}, newUser);
			user = Meteor.users.findOne(userId);
		}

		//creating the token and adding to the user
		var stampedToken = Accounts._generateStampedLoginToken();
		Meteor.users.update(user, {
			$push: {
				'services.resume.loginTokens': stampedToken
			}
		});

		var samlLogin = {
			provider: Accounts.saml.RelayState,
			idp: loginResult.profile.issuer,
			idpSession: loginResult.profile.sessionIndex,
			nameID: loginResult.profile.nameID
		};

		Meteor.users.update({
			_id: user._id
		}, {
			$set: {
				// TBD this should be pushed, otherwise we're only able to SSO into a single IDP at a time
				'services.saml': samlLogin
			}
		});

		//sending token along with the userId
		var result = {
			userId: user._id,
			token: stampedToken.token
		};

		return result;

	} else {
		throw new Error('SAML Profile did not contain an email address');
	}
});

Accounts.saml._loginResultForCredentialToken = {};

Accounts.saml.hasCredential = function(credentialToken) {
	return _.has(Accounts.saml._loginResultForCredentialToken, credentialToken);
};

Accounts.saml.retrieveCredential = function(credentialToken) {
	// The credentialToken in all these functions corresponds to SAMLs inResponseTo field and is mandatory to check.
	var result = Accounts.saml._loginResultForCredentialToken[credentialToken];
	delete Accounts.saml._loginResultForCredentialToken[credentialToken];
	return result;
};

var closePopup = function(res, err) {
	res.writeHead(200, {
		'Content-Type': 'text/html'
	});
	var content = '<html><head><script>window.close()</script></head><body><H1>Verified</H1></body></html>';
	if (err) {
		content = '<html><body><h2>Sorry, an annoying error occured</h2><div>' + err + '</div><a onclick="window.close();">Close Window</a></body></html>';
	}
	res.end(content, 'utf-8');
};

var samlUrlToObject = function(url) {
	// req.url will be '/_saml/<action>/<service name>/<credentialToken>'
	if (!url) {
		return null;
	}

	var splitPath = url.split('/');

	// Any non-saml request will continue down the default
	// middlewares.
	if (splitPath[1] !== '_saml') {
		return null;
	}

	var result = {
		actionName: splitPath[2],
		serviceName: splitPath[3],
		credentialToken: splitPath[4]
	};
	if (Accounts.saml.settings.debug) {
		console.log(result);
	}
	return result;
};

var middleware = function(req, res, next) {
	// Make sure to catch any exceptions because otherwise we'd crash
	// the runner
	try {
		var samlObject = samlUrlToObject(req.url);
		if (!samlObject || !samlObject.serviceName) {
			next();
			return;
		}

		if (!samlObject.actionName) {
			throw new Error('Missing SAML action');
		}

		console.log(Accounts.saml.settings.providers);
		console.log(samlObject.serviceName);
		var service = _.find(Accounts.saml.settings.providers, function(samlSetting) {
			return samlSetting.provider === samlObject.serviceName;
		});

		// Skip everything if there's no service set by the saml middleware
		if (!service) {
			throw new Error('Unexpected SAML service ' + samlObject.serviceName);
		}
		var _saml;
		switch (samlObject.actionName) {
			case 'metadata':
				_saml = new SAML(service);
				service.callbackUrl = Meteor.absoluteUrl('_saml/validate/' + service.provider);
				res.writeHead(200);
				res.write(_saml.generateServiceProviderMetadata(service.callbackUrl));
				res.end();
				//closePopup(res);
				break;
			case 'logout':
				// This is where we receive SAML LogoutResponse
				_saml = new SAML(service);
				_saml.validateLogoutResponse(req.query.SAMLResponse, function(err, result) {
					if (!err) {
						var logOutUser = function(inResponseTo) {
							if (Accounts.saml.settings.debug) {
								console.log('Logging Out user via inResponseTo ' + inResponseTo);
							}
							var loggedOutUser = Meteor.users.find({
								'services.saml.inResponseTo': inResponseTo
							}).fetch();
							if (loggedOutUser.length === 1) {
								if (Accounts.saml.settings.debug) {
									console.log('Found user ' + loggedOutUser[0]._id);
								}
								Meteor.users.update({
									_id: loggedOutUser[0]._id
								}, {
									$set: {
										'services.resume.loginTokens': []
									}
								});
								Meteor.users.update({
									_id: loggedOutUser[0]._id
								}, {
									$unset: {
										'services.saml': ''
									}
								});
							} else {
								throw new Meteor.Error('Found multiple users matching SAML inResponseTo fields');
							}
						};

						fiber(function() {
							logOutUser(result);
						}).run();


						res.writeHead(302, {
							'Location': req.query.RelayState
						});
						res.end();
					}
					//  else {
					// 	// TBD thinking of sth meaning full.
					// }
				});
				break;
			case 'sloRedirect':
				var idpLogout = req.query.redirect;
				res.writeHead(302, {
					// credentialToken here is the SAML LogOut Request that we'll send back to IDP
					'Location': idpLogout
				});
				res.end();
				break;
			case 'authorize':
				service.callbackUrl = Meteor.absoluteUrl('_saml/validate/' + service.provider);
				service.id = samlObject.credentialToken;
				_saml = new SAML(service);
				_saml.getAuthorizeUrl(req, function(err, url) {
					if (err) {
						throw new Error('Unable to generate authorize url');
					}
					res.writeHead(302, {
						'Location': url
					});
					res.end();
				});
				break;
			case 'validate':
				_saml = new SAML(service);
				Accounts.saml.RelayState = req.body.RelayState;
				_saml.validateResponse(req.body.SAMLResponse, req.body.RelayState, function(err, profile/*, loggedOut*/) {
					if (err) {
						throw new Error('Unable to validate response url: ' + err);
					}

					var credentialToken = profile.inResponseToId || profile.InResponseTo || samlObject.credentialToken;
					if (!credentialToken) {
						throw new Error('Unable to determine credentialToken');
					}
					Accounts.saml._loginResultForCredentialToken[credentialToken] = {
						profile: profile
					};
					closePopup(res);
				});
				break;
			default:
				throw new Error('Unexpected SAML action ' + samlObject.actionName);

		}
	} catch (err) {
		closePopup(res, err);
	}
};

// Listen to incoming SAML http requests
WebApp.connectHandlers.use(connect.bodyParser()).use(function(req, res, next) {
	// Need to create a fiber since we're using synchronous http calls and nothing
	// else is wrapping this in a fiber automatically
	fiber(function() {
		middleware(req, res, next);
	}).run();
});
