Meteor.loginWithJEDIS = function(user, password, callback) {
	// TODO replace with rocketchat-ldap's ldap_client.js login
	var loginOptions = {
		username: user,
		jedisPass: password,
		jedis: true 
	}

	Accounts.callLoginMethod({
		methodArguments: [loginOptions],
		userCallback: function(error, result) {
			if (error) {
				callback && callback(error);
			} else {
				callback && callback();
			}
		}
	});
}
