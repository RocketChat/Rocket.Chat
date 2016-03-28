// Pass in username, password as normal
// customLdapOptions should be passed in if you want to override LDAP_DEFAULTS
// on any particular call (if you have multiple ldap servers you'd like to connect to)
// You'll likely want to set the dn value here {dn: "..."}
Meteor.loginWithLDAP = function(username, password, customLdapOptions, callback) {
	// Retrieve arguments as array
	var args = [];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	// Pull username and password
	username = args.shift();
	password = args.shift();

	// Check if last argument is a function
	// if it is, pop it off and set callback to it
	if (typeof args[args.length-1] === 'function') {
		callback = args.pop();
	} else {
		callback = null;
	}

	// if args still holds options item, grab it
	if (args.length > 0) {
		customLdapOptions = args.shift();
	} else {
		customLdapOptions = {};
	}

	// Set up loginRequest object
	var loginRequest = {
		username: username,
		ldapPass: password,
		ldapOptions: customLdapOptions
	};

	Accounts.callLoginMethod({
		// Call login method with ldap = true
		// This will hook into our login handler for ldap
		methodArguments: [loginRequest],
		userCallback: function(error/*, result*/) {
			if (error) {
				if (callback) {
					callback(error);
				}
			} else {
				if (callback) {
					callback();
				}
			}
		}
	});
};
