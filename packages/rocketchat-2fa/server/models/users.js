RocketChat.models.Users.disable2FAAndSetTempSecretByUserId = function(userId, tempToken) {
	return this.update({
		_id: userId
	}, {
		$set: {
			'services.totp': {
				enabled: false,
				tempSecret: tempToken
			}
		}
	});
};

RocketChat.models.Users.enable2FAAndSetSecretByUserId = function(userId, secret) {
	return this.update({
		_id: userId
	}, {
		$set: {
			'services.totp.enabled': true,
			'services.totp.secret': secret
		},
		$unset: {
			'services.totp.tempSecret': 1
		}
	});
};

RocketChat.models.Users.disable2FAByUserId = function(userId) {
	return this.update({
		_id: userId
	}, {
		$set: {
			'services.totp': {
				enabled: false
			}
		}
	});
};
