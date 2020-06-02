import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { WebApp } from 'meteor/webapp';
import { RoutePolicy } from 'meteor/routepolicy';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import bodyParser from 'body-parser';
import fiber from 'fibers';
import _ from 'underscore';
import s from 'underscore.string';

import { SAML } from './saml_utils';
import { settings } from '../../settings/server';
import { Users, Rooms, CredentialTokens } from '../../models/server';
import { generateUsernameSuggestion } from '../../lib';
import { _setUsername, createRoom } from '../../lib/server/functions';

if (!Accounts.saml) {
	Accounts.saml = {
		settings: {
			debug: false,
			generateUsername: false,
			nameOverwrite: false,
			mailOverwrite: false,
			providers: [],
		},
	};
}

RoutePolicy.declare('/_saml/', 'network');

/**
 * Fetch SAML provider configs for given 'provider'.
 */
function getSamlProviderConfig(provider) {
	if (!provider) {
		throw new Meteor.Error('no-saml-provider',
			'SAML internal error',
			{ method: 'getSamlProviderConfig' });
	}
	const samlProvider = function(element) {
		return element.provider === provider;
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
		const user = Users.getSAMLByIdAndSAMLProvider(Meteor.userId(), provider);
		if (!user || !user.services || !user.services.saml) {
			return;
		}

		let { nameID } = user.services.saml;
		const sessionIndex = user.services.saml.idpSession;
		nameID = sessionIndex;
		if (Accounts.saml.settings.debug) {
			console.log(`NameID for user ${ Meteor.userId() } found: ${ JSON.stringify(nameID) }`);
		}

		const _saml = new SAML(providerConfig);

		const request = _saml.generateLogoutRequest({
			nameID,
			sessionIndex,
		});

		// request.request: actual XML SAML Request
		// request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse

		Meteor.users.update({
			_id: Meteor.userId(),
		}, {
			$set: {
				'services.saml.inResponseTo': request.id,
			},
		});

		const _syncRequestToUrl = Meteor.wrapAsync(_saml.requestToUrl, _saml);
		const result = _syncRequestToUrl(request.request, 'logout');
		if (Accounts.saml.settings.debug) {
			console.log(`SAML Logout Request ${ result }`);
		}

		return result;
	},
});

Accounts.normalizeUsername = function(name) {
	switch (Accounts.saml.settings.usernameNormalize) {
		case 'Lowercase':
			name = name.toLowerCase();
			break;
	}

	return name;
};

function debugLog(content) {
	if (Accounts.saml.settings.debug) {
		console.log(content);
	}
}

function getUserDataMapping() {
	const { userDataFieldMap } = Accounts.saml.settings;

	let map;

	try {
		map = JSON.parse(userDataFieldMap);
	} catch (e) {
		map = {};
	}

	let emailField = 'email';
	let usernameField = 'username';
	let nameField = 'cn';
	const newMapping = {};
	const regexes = {};

	const applyField = function(samlFieldName, targetFieldName) {
		if (typeof targetFieldName === 'object') {
			regexes[targetFieldName.field] = targetFieldName.regex;
			targetFieldName = targetFieldName.field;
		}

		if (targetFieldName === 'email') {
			emailField = samlFieldName;
			return;
		}

		if (targetFieldName === 'username') {
			usernameField = samlFieldName;
			return;
		}

		if (targetFieldName === 'name') {
			nameField = samlFieldName;
			return;
		}

		newMapping[samlFieldName] = map[samlFieldName];
	};

	for (const field in map) {
		if (!map.hasOwnProperty(field)) {
			continue;
		}

		const targetFieldName = map[field];

		if (Array.isArray(targetFieldName)) {
			for (const item of targetFieldName) {
				applyField(field, item);
			}
		} else {
			applyField(field, targetFieldName);
		}
	}

	return { emailField, usernameField, nameField, userDataFieldMap: newMapping, regexes };
}

function overwriteData(user, fullName, eppnMatch, emailList) {
	// Overwrite fullname if needed
	if (Accounts.saml.settings.nameOverwrite === true) {
		Meteor.users.update({
			_id: user._id,
		}, {
			$set: {
				name: fullName,
			},
		});
	}

	// Overwrite mail if needed
	if (Accounts.saml.settings.mailOverwrite === true && eppnMatch === true) {
		Meteor.users.update({
			_id: user._id,
		}, {
			$set: {
				emails: emailList.map((email) => ({
					address: email,
					verified: settings.get('Accounts_Verify_Email_For_External_Accounts'),
				})),
			},
		});
	}
}

function getProfileValue(profile, samlFieldName, regex) {
	const value = profile[samlFieldName];

	if (!regex) {
		return value;
	}

	if (!value || !value.match) {
		return;
	}

	const match = value.match(new RegExp(regex));
	if (!match || !match.length) {
		return;
	}

	if (match.length >= 2) {
		return match[1];
	}

	return match[0];
}

const guessNameFromUsername = (username) =>
	username
		.replace(/\W/g, ' ')
		.replace(/\s(.)/g, (u) => u.toUpperCase())
		.replace(/^(.)/, (u) => u.toLowerCase())
		.replace(/^\w/, (u) => u.toUpperCase());

const findUser = (username, emailRegex) => {
	if (Accounts.saml.settings.immutableProperty === 'Username') {
		if (username) {
			return Meteor.users.findOne({
				username,
			});
		}

		return null;
	}

	return Meteor.users.findOne({
		'emails.address': emailRegex,
	});
};

Accounts.registerLoginHandler(function(loginRequest) {
	if (!loginRequest.saml || !loginRequest.credentialToken) {
		return undefined;
	}

	const loginResult = Accounts.saml.retrieveCredential(loginRequest.credentialToken);
	debugLog(`RESULT :${ JSON.stringify(loginResult) }`);

	if (loginResult === undefined) {
		return {
			type: 'saml',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'No matching login attempt found'),
		};
	}
	const { emailField, usernameField, nameField, userDataFieldMap, regexes } = getUserDataMapping();
	const { defaultUserRole = 'user', roleAttributeName, roleAttributeSync } = Accounts.saml.settings;

	if (loginResult && loginResult.profile && loginResult.profile[emailField]) {
		try {
			const emailList = Array.isArray(loginResult.profile[emailField]) ? loginResult.profile[emailField] : [loginResult.profile[emailField]];
			const emailRegex = new RegExp(emailList.map((email) => `^${ RegExp.escape(email) }$`).join('|'), 'i');

			const eduPersonPrincipalName = loginResult.profile.eppn;
			const profileFullName = getProfileValue(loginResult.profile, nameField, regexes.name);
			const fullName = profileFullName || loginResult.profile.displayName || loginResult.profile.username;

			let eppnMatch = false;
			let user = null;

			// Check eppn
			if (eduPersonPrincipalName) {
				user = Meteor.users.findOne({
					eppn: eduPersonPrincipalName,
				});

				if (user) {
					eppnMatch = true;
				}
			}

			let username;
			if (loginResult.profile[usernameField]) {
				const profileUsername = getProfileValue(loginResult.profile, usernameField, regexes.username);
				if (profileUsername) {
					username = Accounts.normalizeUsername(profileUsername);
				}
			}

			// If eppn is not exist
			if (!user) {
				user = findUser(username, emailRegex);
			}

			const emails = emailList.map((email) => ({
				address: email,
				verified: settings.get('Accounts_Verify_Email_For_External_Accounts'),
			}));

			let globalRoles;
			if (roleAttributeName && loginResult.profile[roleAttributeName]) {
				globalRoles = [].concat(loginResult.profile[roleAttributeName]);
			} else {
				globalRoles = [].concat(defaultUserRole.split(','));
			}

			if (!user) {
				const newUser = {
					name: fullName,
					active: true,
					eppn: eduPersonPrincipalName,
					globalRoles,
					emails,
					services: {},
				};

				if (Accounts.saml.settings.generateUsername === true) {
					username = generateUsernameSuggestion(newUser);
				}

				if (username) {
					newUser.username = username;
					newUser.name = newUser.name || guessNameFromUsername(username);
				}

				const languages = TAPi18n.getLanguages();
				if (languages[loginResult.profile.language]) {
					newUser.language = loginResult.profile.language;
				}

				const userId = Accounts.insertUserDoc({}, newUser);
				user = Meteor.users.findOne(userId);

				if (loginResult.profile.channels) {
					const channels = loginResult.profile.channels.split(',');
					Accounts.saml.subscribeToSAMLChannels(channels, user);
				}
			}

			// If eppn is not exist then update
			if (eppnMatch === false) {
				Meteor.users.update({
					_id: user._id,
				}, {
					$set: {
						eppn: eduPersonPrincipalName,
					},
				});
			}

			// creating the token and adding to the user
			const stampedToken = Accounts._generateStampedLoginToken();
			Meteor.users.update(user, {
				$push: {
					'services.resume.loginTokens': stampedToken,
				},
			});

			const samlLogin = {
				provider: Accounts.saml.RelayState,
				idp: loginResult.profile.issuer,
				idpSession: loginResult.profile.sessionIndex,
				nameID: loginResult.profile.nameID,
			};

			const updateData = {
				// TBD this should be pushed, otherwise we're only able to SSO into a single IDP at a time
				'services.saml': samlLogin,
			};

			for (const field in userDataFieldMap) {
				if (!userDataFieldMap.hasOwnProperty(field)) {
					continue;
				}

				if (loginResult.profile[field]) {
					const rcField = userDataFieldMap[field];
					const value = getProfileValue(loginResult.profile, field, regexes[rcField]);
					updateData[`customFields.${ rcField }`] = value;
				}
			}

			if (Accounts.saml.settings.immutableProperty !== 'EMail') {
				updateData.emails = emails;
			}

			if (roleAttributeSync) {
				updateData.roles = globalRoles;
			}

			Meteor.users.update({
				_id: user._id,
			}, {
				$set: updateData,
			});

			if (username) {
				_setUsername(user._id, username);
			}

			overwriteData(user, fullName, eppnMatch, emailList);

			// sending token along with the userId
			const result = {
				userId: user._id,
				token: stampedToken.token,
			};

			return result;
		} catch (error) {
			console.error(error);
			return {
				type: 'saml',
				error,
			};
		}
	}
	throw new Error('SAML Profile did not contain an email address');
});


Accounts.saml.subscribeToSAMLChannels = function(channels, user) {
	try {
		for (let roomName of channels) {
			roomName = roomName.trim();
			if (!roomName) {
				continue;
			}

			let room = Rooms.findOneByNameAndType(roomName, 'c');
			if (!room) {
				room = createRoom('c', roomName, user.username);
			}
		}
	} catch (err) {
		console.error(err);
	}
};

Accounts.saml.hasCredential = function(credentialToken) {
	return CredentialTokens.findOneById(credentialToken) != null;
};

Accounts.saml.retrieveCredential = function(credentialToken) {
	// The credentialToken in all these functions corresponds to SAMLs inResponseTo field and is mandatory to check.
	const data = CredentialTokens.findOneById(credentialToken);
	if (data) {
		return data.userInfo;
	}
};

Accounts.saml.storeCredential = function(credentialToken, loginResult) {
	CredentialTokens.create(credentialToken, loginResult);
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
		credentialToken: splitPath[4],
	};
	if (Accounts.saml.settings.debug) {
		console.log(result);
	}
	return result;
};

const logoutRemoveTokens = function(userId) {
	if (Accounts.saml.settings.debug) {
		console.log(`Found user ${ userId }`);
	}

	Meteor.users.update({
		_id: userId,
	}, {
		$set: {
			'services.resume.loginTokens': [],
		},
	});

	Meteor.users.update({
		_id: userId,
	}, {
		$unset: {
			'services.saml': '',
		},
	});
};

const showErrorMessage = function(res, err) {
	res.writeHead(200, {
		'Content-Type': 'text/html',
	});
	const content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${ s.escapeHTML(err) }</div></body></html>`;
	res.end(content, 'utf-8');
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

		if (Accounts.saml.settings.debug) {
			console.log(Accounts.saml.settings.providers);
			console.log(samlObject.serviceName);
		}
		const service = _.find(Accounts.saml.settings.providers, function(samlSetting) {
			return samlSetting.provider === samlObject.serviceName;
		});

		// Skip everything if there's no service set by the saml middleware
		if (!service) {
			if (samlObject.actionName === 'metadata') {
				showErrorMessage(res, `Unexpected SAML service ${ samlObject.serviceName }`);
				return;
			}

			throw new Error(`Unexpected SAML service ${ samlObject.serviceName }`);
		}

		let _saml;
		switch (samlObject.actionName) {
			case 'metadata':
				try {
					_saml = new SAML(service);
					service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${ service.provider }`);
				} catch (err) {
					showErrorMessage(res, err);
					return;
				}

				res.writeHead(200);
				res.write(_saml.generateServiceProviderMetadata(service.callbackUrl));
				res.end();
				break;
			case 'logout':
				// This is where we receive SAML LogoutResponse
				_saml = new SAML(service);
				if (req.query.SAMLRequest) {
					_saml.validateLogoutRequest(req.query.SAMLRequest, function(err, result) {
						if (err) {
							console.error(err);
							throw new Meteor.Error('Unable to Validate Logout Request');
						}

						const logOutUser = function(samlInfo) {
							const loggedOutUser = Meteor.users.find({
								$or: [
									{ 'services.saml.nameID': samlInfo.nameID },
									{ 'services.saml.idpSession': samlInfo.idpSession },
								],
							}).fetch();

							if (loggedOutUser.length === 1) {
								logoutRemoveTokens(loggedOutUser[0]._id);
							}
						};

						fiber(function() {
							logOutUser(result);
						}).run();

						const { response } = _saml.generateLogoutResponse({
							nameID: result.nameID,
							sessionIndex: result.idpSession,
						});

						_saml.logoutResponseToUrl(response, function(err, url) {
							if (err) {
								console.error(err);
								throw new Meteor.Error('Unable to generate SAML logout Response Url');
							}

							res.writeHead(302, {
								Location: url,
							});
							res.end();
						});
					});
				} else {
					_saml.validateLogoutResponse(req.query.SAMLResponse, function(err, result) {
						if (!err) {
							const logOutUser = function(inResponseTo) {
								if (Accounts.saml.settings.debug) {
									console.log(`Logging Out user via inResponseTo ${ inResponseTo }`);
								}
								const loggedOutUser = Meteor.users.find({
									'services.saml.inResponseTo': inResponseTo,
								}).fetch();
								if (loggedOutUser.length === 1) {
									logoutRemoveTokens(loggedOutUser[0]._id);
								} else {
									throw new Meteor.Error('Found multiple users matching SAML inResponseTo fields');
								}
							};

							fiber(function() {
								logOutUser(result);
							}).run();


							res.writeHead(302, {
								Location: req.query.RelayState,
							});
							res.end();
						}
					});
				}
				break;
			case 'sloRedirect':
				res.writeHead(302, {
					// credentialToken here is the SAML LogOut Request that we'll send back to IDP
					Location: req.query.redirect,
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
						Location: url,
					});
					res.end();
				});
				break;
			case 'validate':
				_saml = new SAML(service);
				Accounts.saml.RelayState = req.body.RelayState;
				_saml.validateResponse(req.body.SAMLResponse, req.body.RelayState, function(err, profile/* , loggedOut*/) {
					if (err) {
						throw new Error(`Unable to validate response url: ${ err }`);
					}

					let credentialToken = (profile.inResponseToId && profile.inResponseToId.value) || profile.inResponseToId || profile.InResponseTo || samlObject.credentialToken;
					const loginResult = {
						profile,
					};

					if (!credentialToken) {
						// No credentialToken in IdP-initiated SSO
						credentialToken = Random.id();

						if (Accounts.saml.settings.debug) {
							console.log('[SAML] Using random credentialToken: ', credentialToken);
						}
					}

					Accounts.saml.storeCredential(credentialToken, loginResult);
					const url = `${ Meteor.absoluteUrl('home') }?saml_idp_credentialToken=${ credentialToken }`;
					res.writeHead(302, {
						Location: url,
					});
					res.end();
				});
				break;
			default:
				throw new Error(`Unexpected SAML action ${ samlObject.actionName }`);
		}
	} catch (err) {
		// #ToDo: Ideally we should send some error message to the client, but there's no way to do it on a redirect right now.
		console.log(err);

		const url = Meteor.absoluteUrl('home');
		res.writeHead(302, {
			Location: url,
		});
		res.end();
	}
};

// Listen to incoming SAML http requests
WebApp.connectHandlers.use(bodyParser.json()).use(function(req, res, next) {
	// Need to create a fiber since we're using synchronous http calls and nothing
	// else is wrapping this in a fiber automatically
	fiber(function() {
		middleware(req, res, next);
	}).run();
});
