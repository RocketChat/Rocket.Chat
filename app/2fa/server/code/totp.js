import { TOTP } from '../lib/totp';

export function isEnabled(user) {
	return user.services && user.services.totp && user.services.totp.enabled === true;
}

export function verify(user, code) {
	if (!isEnabled(user)) {
		return false;
	}

	return TOTP.verify({
		secret: user.services.totp.secret,
		token: code,
		userId: user._id,
		backupTokens: user.services.totp.hashedBackup,
	});
}
