Future = Npm.require('fibers/future');

var slug = function (text) {
	text = slugify(text, '.');
	return text.replace(/[^0-9a-z-_.]/g, '');
};

// At a minimum, set up LDAP_DEFAULTS.url and .dn according to
// your needs. url should appear as "ldap://your.url.here"
// dn should appear in normal ldap format of comma separated attribute=value
// e.g. "uid=someuser,cn=users,dc=somevalue"
LDAP_DEFAULTS = {
	url: false,
	port: '389',
	dn: false,
	createNewUser: true,
	defaultDomain: false,
	searchResultsProfileMap: false,
	bindSearch: undefined
};

/**
 @class LDAP
 @constructor
 */
var LDAP = function(options) {
	// Set options
	this.options = _.defaults(options, LDAP_DEFAULTS);

	// Make sure options have been set
	try {
		check(this.options.url, String);
		check(this.options.dn, String);
	} catch (e) {
		throw new Meteor.Error("Bad Defaults", "Options not set. Make sure to set LDAP_DEFAULTS.url and LDAP_DEFAULTS.dn!");
	}

	// Because NPM ldapjs module has some binary builds,
	// We had to create a wraper package for it and build for
	// certain architectures. The package typ:ldap-js exports
	// "MeteorWrapperLdapjs" which is a wrapper for the npm module
	this.ldapjs = MeteorWrapperLdapjs;
};

/**
 * Attempt to bind (authenticate) ldap
 * and perform a dn search if specified
 *
 * @method ldapCheck
 *
 * @param {Object} options  Object with username, ldapPass and overrides for LDAP_DEFAULTS object
 */
LDAP.prototype.ldapCheck = function(options) {

	var self = this;

	options = options || {};

	if (options.hasOwnProperty('username') && options.hasOwnProperty('ldapPass')) {

		var ldapAsyncFut = new Future();


		// Create ldap client
		var fullUrl = self.options.url + ':' + self.options.port;
		var client = self.ldapjs.createClient({
			url: fullUrl
		});

		var bindSync = Meteor.wrapAsync(client.bind.bind(client));

		// Slide @xyz.whatever from username if it was passed in
		// and replace it with the domain specified in defaults
		var emailSliceIndex = options.username.indexOf('@');
		var username;
		var domain = self.options.defaultDomain;

		// If user appended email domain, strip it out
		// And use the defaults.defaultDomain if set
		if (emailSliceIndex !== -1) {
			username = options.username.substring(0, emailSliceIndex);
			domain = domain || options.username.substring((emailSliceIndex + 1), options.username.length);
		} else {
			username = options.username;
		}

		var bind = function(dn) {
			dn = dn.replace(/#{username}/g, options.username);
			console.log('Attempt to bind', dn);
			//Attempt to bind to ldap server with provided info
			client.bind(dn, options.ldapPass, function(err) {
				try {
					if (err) {
						// Bind failure, return error
						console.log(err);
						throw new Meteor.Error(err.code, err.message);
					} else {
						// Bind auth successful
						// Create return object
						var retObject = {
							username: username,
							searchResults: null
						};
						// Set email on return object
						retObject.email = domain ? username + '@' + domain : false;
						// Return search results if specified
						if (self.options.searchResultsProfileMap) {
							client.search(dn, {}, function(err, res) {
								res.on('searchEntry', function(entry) {
									// Add entry results to return object
									retObject.searchResults = entry.object;

									ldapAsyncFut.return(retObject);
								});

							});
						}
						// No search results specified, return username and email object
						else {
							ldapAsyncFut.return(retObject);
						}
					}
				} catch (e) {
					console.log(e);
					ldapAsyncFut.return({
						error: e
					});
				}
			});
		};

		if (LDAP_DEFAULTS.bindSearch && LDAP_DEFAULTS.bindSearch.trim() != '') {
			try {
				var bindSearch = LDAP_DEFAULTS.bindSearch.replace(/#{username}/g, options.username);
				var opts = JSON.parse(bindSearch);

				if (opts.userDN && opts.password) {
					try {
						console.log('Bind before search', opts.userDN, opts.password);
						bindSync(opts.userDN, opts.password);
						delete opts.userDN;
						delete opts.password;
					} catch(e) {
						console.log('LDAP: Error', e);
						ldapAsyncFut.return({
							error: e
						});
					}
				}

				console.log('LDAP search dn', options.ldapOptions.dn);
				console.log('LDAP search options', opts);
				client.search(options.ldapOptions.dn, opts, function(err, res) {
					if (err) {
						console.log('LDAP: Search Error', err);
						ldapAsyncFut.return({
							error: err
						});
					}
					var dn = self.options.dn;
					res.on('searchEntry', function(entry) {
						dn = entry.object.dn;
					});
					res.on('error', function(err) {
						console.log('LDAP: Search on Error', err);
						ldapAsyncFut.return({
							error: err
						});
					});
					res.on('end', function(result) {
						bind(dn);
					});
				});
			} catch (e) {
				console.log('LDAP: BindSearch Error', e);
				ldapAsyncFut.return({
					error: e
				});
			}
		} else {
			bind(self.options.dn);
		}

		return ldapAsyncFut.wait();

	} else {
		throw new Meteor.Error(403, "Missing LDAP Auth Parameter");
	}

};


// Register login handler with Meteor
// Here we create a new LDAP instance with options passed from
// Meteor.loginWithLDAP on client side
// @param {Object} loginRequest will consist of username, ldapPass, ldap, and ldapOptions
Accounts.registerLoginHandler("ldap", function(loginRequest) {
	// If "ldap" isn't set in loginRequest object,
	// then this isn't the proper handler (return undefined)
	if (!loginRequest.ldap) {
		return undefined;
	}

	// Instantiate LDAP with options
	var userOptions = loginRequest.ldapOptions || {};
	if (RocketChat.settings.get('LDAP_Sync_User_Data')) {
		userOptions.searchResultsProfileMap = true;
	}

	// Don't allow overwriting url and port
	delete userOptions.url;
	delete userOptions.port;

	var ldapObj = new LDAP(userOptions);

	// Call ldapCheck and get response
	var ldapResponse = ldapObj.ldapCheck(loginRequest);

	if (ldapResponse.error) {
		throw new Meteor.Error("LDAP-login-error", ldapResponse.error);
	} else {
		// Set initial userId and token vals
		var userId = null;
		var stampedToken = {
			token: null
		};

		var username = slug(ldapResponse.username);

		// Look to see if user already exists
		var user = Meteor.users.findOne({
			username: username
		});

		// Login user if they exist
		if (user) {
			if (user.ldap !== true) {
				throw new Meteor.Error("LDAP-login-error", "LDAP Authentication succeded, but there's already an existing user with provided username ["+username+"] in Mongo.");
			}

			userId = user._id;

			// Create hashed token so user stays logged in
			stampedToken = Accounts._generateStampedLoginToken();
			var hashStampedToken = Accounts._hashStampedToken(stampedToken);
			// Update the user's token in mongo
			Meteor.users.update(userId, {
				$push: {
					'services.resume.loginTokens': hashStampedToken
				}
			});
		}
		// Otherwise create user if option is set
		else if (ldapObj.options.createNewUser) {
			var userObject = {
				username: slug(ldapResponse.username)
			};
			// Set email
			if (ldapResponse.email) userObject.email = ldapResponse.email;

			// Set profile values if specified in searchResultsProfileMap
			if (ldapResponse.searchResults && ldapObj.options.searchResultsProfileMap.length > 0) {

				var profileMap = ldapObj.options.searchResultsProfileMap;
				var profileObject = {};

				// Loop through profileMap and set values on profile object
				for (var i = 0; i < profileMap.length; i++) {
					var resultKey = profileMap[i].resultKey;

					// If our search results have the specified property, set the profile property to its value
					if (ldapResponse.searchResults.hasOwnProperty(resultKey)) {
						profileObject[profileMap[i].profileProperty] = ldapResponse.searchResults[resultKey];
					}

				}
				// Set userObject profile
				userObject.profile = profileObject;
			}

			userId = Accounts.createUser(userObject);
			Meteor.users.update(userId, {$set: {
				ldap: true
			}});
			Meteor.runAsUser(userId, function() {
				Meteor.call('joinDefaultChannels');
			});
		} else {
			// Ldap success, but no user created
			throw new Meteor.Error("LDAP-login-error", "LDAP Authentication succeded, but no user exists in Mongo. Either create a user for this email or set LDAP_DEFAULTS.createNewUser to true");
		}

		// LDAP sync data logic
		var syncUserData = RocketChat.settings.get('LDAP_Sync_User_Data');
		var syncUserDataFieldMap = RocketChat.settings.get('LDAP_Sync_User_Data_FieldMap').trim();
		if (userId && syncUserData && syncUserDataFieldMap) {
			var userData = {};
			var fieldMap = JSON.parse(syncUserDataFieldMap);

			var emailList = [];
			_.map(fieldMap, function(userField, ldapField) {
				if (!ldapResponse.searchResults.hasOwnProperty(ldapField)) {
					return;
				}

				// restrict field mapping to a known list of fields
				switch (userField) {

					case 'email':
						if ('object' == typeof ldapResponse.searchResults[ldapField]) {
							_.map(ldapResponse.searchResults[ldapField], function (item) {
								emailList.push({ address: item, verified: true });
							});
						} else {
							emailList.push({ address: ldapResponse.searchResults[ldapField], verified: true });
						}
						break;

					case 'name':
						userData.name = ldapResponse.searchResults[ldapField];
						break;

					default:
						break;
				}
			});

			if (emailList.length) {
				userData.emails = emailList;
			}

			if (_.size(userData)) {
				Meteor.users.update(userId, { $set: userData });
			}

		}

		return {
			userId: userId,
			token: stampedToken.token
		};
	}

	return undefined;
});
