import speakeasy from 'speakeasy';

RocketChat.TOTP = {
	generateSecret() {
		return speakeasy.generateSecret();
	},

	generateOtpauthURL(secret, username) {
		return speakeasy.otpauthURL({
			secret: secret.ascii,
			label: `Rocket.Chat:${ username }`
		});
	},

	verify(secret, token) {
		return speakeasy.totp.verify({
			secret: secret,
			encoding: 'base32',
			token: token
		});
	}
};
