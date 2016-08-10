Meteor.loginWithCrowd = function(username, password, callback) {
	// Retrieve arguments as array
	var args = [];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	// Pull username and password
	username = args.shift();
	password = args.shift();
	var loginRequest = {
		crowd: true,
		username: username,
		crowdPassword: password
	};
	Accounts.callLoginMethod({
		methodArguments: [loginRequest],
		userCallback: function(error) {
			if (error) {
				if (callback) {
					callback(error);
				}
			} else if (callback) {
				callback();
			}
		}
	});
};
