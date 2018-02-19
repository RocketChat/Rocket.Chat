Meteor.loginWithPasswordAndTOTP = function(selector, password, code, callback) {
	if (typeof selector === 'string') {
		if (selector.indexOf('@') === -1) {
			selector = {username: selector};
		} else {
			selector = {email: selector};
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: {
					user: selector,
					password: Accounts._hashPassword(password)
				},
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

const loginWithPassword = Meteor.loginWithPassword;

Meteor.loginWithPassword = function(email, password, cb) {
	/* globals overrideLoginMethod*/
	overrideLoginMethod(loginWithPassword, [email, password], cb, Meteor.loginWithPasswordAndTOTP);
};
