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

RocketChat.models.Users.enable2FAAndSetSecretAndCodesByUserId = function(userId, secret, backupCodes) {
	return this.update({
		_id: userId
	}, {
		$set: {
			'services.totp.enabled': true,
			'services.totp.secret': secret,
			'services.totp.hashedBackup': backupCodes
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

RocketChat.models.Users.update2FABackupCodesByUserId = function(userId, backupCodes) {
	return this.update({
		_id: userId
	}, {
		$set: {
			'services.totp.hashedBackup': backupCodes
		}
	});
};
