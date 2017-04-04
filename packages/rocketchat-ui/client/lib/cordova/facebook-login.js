/* globals facebookConnectPlugin Facebook*/
Meteor.loginWithFacebookCordova = function(options, callback) {
	if (!callback && typeof options === 'function') {
		callback = options;
		options = null;
	}
	const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
	const fbLoginSuccess = function(data) {
		data.cordova = true;
		return Accounts.callLoginMethod({
			methodArguments: [data],
			userCallback: callback
		});
	};
	if (typeof facebookConnectPlugin !== 'undefined') {
		return facebookConnectPlugin.getLoginStatus(function(response) {
			if (response.status !== 'connected') {
				return facebookConnectPlugin.login(['public_profile', 'email'], fbLoginSuccess, function(error) {
					console.log('login', JSON.stringify(error), error);
					return callback(error);
				});
			} else {
				return fbLoginSuccess(response);
			}
		}, function(error) {
			console.log('getLoginStatus', JSON.stringify(error), error);
			return callback(error);
		});
	}
	return Facebook.requestCredential(options, credentialRequestCompleteCallback);
};
