Meteor.loginWithCrowd = function(username, password, callback) {
	// Retrieve arguments as array
	const args = [];
	for (let i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	// Pull username and password
	username = args.shift();
	password = args.shift();
	const loginRequest = {
		crowd: true,
		username,
		crowdPassword: password
	};
	Accounts.callLoginMethod({
		methodArguments: [loginRequest],
		userCallback(error) {
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
