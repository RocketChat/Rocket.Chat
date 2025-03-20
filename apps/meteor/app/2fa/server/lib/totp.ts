import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { SHA256 } from '@rocket.chat/sha256';
import speakeasy from 'speakeasy';

import { settings } from '../../../settings/server';

export const TOTP = {
	generateSecret(): speakeasy.GeneratedSecret {
		return speakeasy.generateSecret();
	},

	generateOtpauthURL(secret: speakeasy.GeneratedSecret, username: string): string {
		return speakeasy.otpauthURL({
			secret: secret.ascii,
			label: `Rocket.Chat:${username}`,
		});
	},

	async verify({
		secret,
		token,
		backupTokens,
		userId,
	}: {
		secret: string;
		token: string;
		backupTokens?: string[];
		userId?: string;
	}): Promise<boolean> {
		// validates a backup code
		if (token.length === 8 && backupTokens) {
			const hashedCode = SHA256(token);
			const usedCode = backupTokens.indexOf(hashedCode);

			if (usedCode !== -1 && userId) {
				backupTokens.splice(usedCode, 1);

				// mark the code as used (remove it from the list)
				await Users.update2FABackupCodesByUserId(userId, backupTokens);
				return true;
			}

			return false;
		}

		const maxDelta = settings.get<number>('Accounts_TwoFactorAuthentication_MaxDelta');
		if (maxDelta) {
			const verifiedDelta = speakeasy.totp.verifyDelta({
				secret,
				encoding: 'base32',
				token,
				window: maxDelta,
			});

			return verifiedDelta !== undefined;
		}

		return speakeasy.totp.verify({
			secret,
			encoding: 'base32',
			token,
		});
	},

	generateCodes(): { codes: string[]; hashedCodes: string[] } {
		// generate 12 backup codes
		const codes = [];
		const hashedCodes = [];
		for (let i = 0; i < 12; i++) {
			const code = Random.id(8);
			codes.push(code);
			hashedCodes.push(SHA256(code));
		}

		return { codes, hashedCodes };
	},
};
