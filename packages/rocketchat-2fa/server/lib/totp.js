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

	verify({ secret, token, backupTokens, userId }) {
		// validates a backup code
		if (token.length === 8 && backupTokens) {
			const hashedCode = SHA256(token);
			const usedCode = backupTokens.indexOf(hashedCode);

			if (usedCode !== -1) {
				backupTokens.splice(usedCode, 1);

				// mark the code as used (remove it from the list)
				RocketChat.models.Users.update2FABackupCodesByUserId(userId, backupTokens);
				return true;
			}

			return false;
		}

		const maxDelta = RocketChat.settings.get('Accounts_TwoFactorAuthentication_MaxDelta');
		if (maxDelta) {
			const verifiedDelta = speakeasy.totp.verifyDelta({
				secret,
				encoding: 'base32',
				token,
				window: maxDelta
			});

			return verifiedDelta !== undefined;
		}
		
		return speakeasy.totp.verify({
			secret,
			encoding: 'base32',
			token
		});
	},

	generateCodes() {
		// generate 12 backup codes
		const codes = [];
		const hashedCodes = [];
		for (let i = 0; i < 12; i++) {
			const code = Random.id(8);
			codes.push(code);
			hashedCodes.push(SHA256(code));
		}

		return { codes, hashedCodes };
	}
};
