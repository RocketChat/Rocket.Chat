Meteor.loginWithLDAPAndTOTP = function(selector, password, code, callback) {
	let customLdapOptions;
	const args = [];
	for (let i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	// Pull username and password
	selector = args.shift();
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
	const loginRequest = {
		ldap: true,
		username: selector,
		ldapPass: password,
		ldapOptions: customLdapOptions
	};
	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: loginRequest,
				code
			}
		}],
		userCallback(error) {
			if (error) {
				/* globals reportError*/
				reportError(error, callback);
			} else {
				callback && callback();
			}
		}
	});
};

const loginWithLDAP = Meteor.loginWithLDAP;

Meteor.loginWithLDAP = function(username, password, cb) {
	/* globals overrideLoginMethod*/
	overrideLoginMethod(loginWithLDAP, [username, password], cb, Meteor.loginWithLDAPAndTOTP);
};
