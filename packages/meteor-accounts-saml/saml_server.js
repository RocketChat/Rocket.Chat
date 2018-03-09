/* globals RoutePolicy, SAML */
/* jshint newcap: false */
import _ from 'underscore';

if (!Accounts.saml) {
	Accounts.saml = {
		settings: {
			debug: true,
			generateUsername: false,
			providers: []
		}
	};
}

import fiber from 'fibers';
import connect from 'connect';
RoutePolicy.declare('/_saml/', 'network');

/**
 * Fetch SAML provider configs for given 'provider'.
 */
function getSamlProviderConfig(provider) {
	if (! provider) {
		throw new Meteor.Error('no-saml-provider',
			'SAML internal error',
			{ method: 'getSamlProviderConfig' });
	}
	const samlProvider = function(element) {
		return (element.provider === provider);
	};
	return Accounts.saml.settings.providers.filter(samlProvider)[0];
}

Meteor.methods({
	samlLogout(provider) {
		// Make sure the user is logged in before initiate SAML SLO
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'samlLogout' });
		}
		const providerConfig = getSamlProviderConfig(provider);

		if (Accounts.saml.settings.debug) {
			console.log(`Logout request from ${ JSON.stringify(providerConfig) }`);
		}
		// This query should respect upcoming array of SAML logins
		const user = Meteor.users.findOne({
			_id: Meteor.userId(),
			'services.saml.provider': provider
		}, {
			'services.saml': 1
		});
		let nameID = user.services.saml.nameID;
		const sessionIndex = user.services.saml.idpSession;
		nameID = sessionIndex;
		if (Accounts.saml.settings.debug) {
			console.log(`NameID for user ${ Meteor.userId() } found: ${ JSON.stringify(nameID) }`);
		}

		const _saml = new SAML(providerConfig);

		const request = _saml.generateLogoutRequest({
			nameID,
			sessionIndex
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

		const _syncRequestToUrl = Meteor.wrapAsync(_saml.requestToUrl, _saml);
		const result = _syncRequestToUrl(request.request, 'logout');
		if (Accounts.saml.settings.debug) {
			console.log(`SAML Logout Request ${ result }`);
		}


		return result;
	}
});

Accounts.registerLoginHandler(function(loginRequest) {
	if (!loginRequest.saml || !loginRequest.credentialToken) {
		return undefined;
	}

	const loginResult = Accounts.saml.retrieveCredential(loginRequest.credentialToken);
	if (Accounts.saml.settings.debug) {
		console.log(`RESULT :${ JSON.stringify(loginResult) }`);
	}

	if (loginResult === undefined) {
		return {
			type: 'saml',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'No matching login attempt found')
		};
	}

	if (loginResult && loginResult.profile && loginResult.profile.email) {
		const email = RegExp.escape(loginResult.profile.email);
		const emailRegex = new RegExp(`^${ email }$`, 'i');
		let user = Meteor.users.findOne({
			'emails.address': emailRegex
		});

		if (!user) {
			const newUser = {
				name: loginResult.profile.cn || loginResult.profile.username,
				active: true,
				globalRoles: ['user'],
				emails: [{
					address: loginResult.profile.email,
					verified: true
				}]
			};

			if (Accounts.saml.settings.generateUsername === true) {
				const username = RocketChat.generateUsernameSuggestion(newUser);
				if (username) {
					newUser.username = username;
				}
			} else if (loginResult.profile.username) {
				newUser.username = loginResult.profile.username;
			}

			const userId = Accounts.insertUserDoc({}, newUser);
			user = Meteor.users.findOne(userId);
		}

		//creating the token and adding to the user
		const stampedToken = Accounts._generateStampedLoginToken();
		Meteor.users.update(user, {
			$push: {
				'services.resume.loginTokens': stampedToken
			}
		});

		const samlLogin = {
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
		const result = {
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
	const result = Accounts.saml._loginResultForCredentialToken[credentialToken];
	delete Accounts.saml._loginResultForCredentialToken[credentialToken];
	return result;
};

const closePopup = function(res, err) {
	res.writeHead(200, {
		'Content-Type': 'text/html'
	});
	let content = '<html><head><script>window.close()</script></head><body><H1>Verified</H1></body></html>';
	if (err) {
		content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${ err }</div><a onclick="window.close();">Close Window</a></body></html>`;
	}
	res.end(content, 'utf-8');
};

const samlUrlToObject = function(url) {
	// req.url will be '/_saml/<action>/<service name>/<credentialToken>'
	if (!url) {
		return null;
	}

	const splitUrl = url.split('?');
	const splitPath = splitUrl[0].split('/');

	// Any non-saml request will continue down the default
	// middlewares.
	if (splitPath[1] !== '_saml') {
		return null;
	}

	const result = {
		actionName: splitPath[2],
		serviceName: splitPath[3],
		credentialToken: splitPath[4]
	};
	if (Accounts.saml.settings.debug) {
		console.log(result);
	}
	return result;
};

const middleware = function(req, res, next) {
	// Make sure to catch any exceptions because otherwise we'd crash
	// the runner
	try {
		const samlObject = samlUrlToObject(req.url);
		if (!samlObject || !samlObject.serviceName) {
			next();
			return;
		}

		if (!samlObject.actionName) {
			throw new Error('Missing SAML action');
		}

		console.log(Accounts.saml.settings.providers);
		console.log(samlObject.serviceName);
		const service = _.find(Accounts.saml.settings.providers, function(samlSetting) {
			return samlSetting.provider === samlObject.serviceName;
		});

		// Skip everything if there's no service set by the saml middleware
		if (!service) {
			throw new Error(`Unexpected SAML service ${ samlObject.serviceName }`);
		}
		let _saml;
		switch (samlObject.actionName) {
			case 'metadata':
				_saml = new SAML(service);
				service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${ service.provider }`);
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
						const logOutUser = function(inResponseTo) {
							if (Accounts.saml.settings.debug) {
								console.log(`Logging Out user via inResponseTo ${ inResponseTo }`);
							}
							const loggedOutUser = Meteor.users.find({
								'services.saml.inResponseTo': inResponseTo
							}).fetch();
							if (loggedOutUser.length === 1) {
								if (Accounts.saml.settings.debug) {
									console.log(`Found user ${ loggedOutUser[0]._id }`);
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
				res.writeHead(302, {
					// credentialToken here is the SAML LogOut Request that we'll send back to IDP
					'Location': req.query.redirect
				});
				res.end();
				break;
			case 'authorize':
				service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${ service.provider }`);
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
						throw new Error(`Unable to validate response url: ${ err }`);
					}

					const credentialToken = profile.inResponseToId.value || profile.InResponseTo || samlObject.credentialToken;
					if (!credentialToken) {
						// No credentialToken in IdP-initiated SSO
						const saml_idp_credentialToken = Random.id();
						Accounts.saml._loginResultForCredentialToken[saml_idp_credentialToken] = {
							profile
						};
						const url = `${ Meteor.absoluteUrl('home') }?saml_idp_credentialToken=${ saml_idp_credentialToken }`;
						res.writeHead(302, {
							'Location': url
						});
						res.end();
					} else {
						Accounts.saml._loginResultForCredentialToken[credentialToken] = {
							profile
						};
						closePopup(res);
					}
				});
				break;
			default:
				throw new Error(`Unexpected SAML action ${ samlObject.actionName }`);

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
