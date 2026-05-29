import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { notifyOnUserChange, notifyOnUserChangeAsync } from '../../../lib/server/lib/notifyListener';
import { TOTP } from '../lib/totp';

const requireUser = async (userId: string | null) => {
	if (!userId) {
		throw new Meteor.Error('not-authorized');
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	return user;
};

export const enableTotp = async (userId: string | null): Promise<{ secret: string; url: string }> => {
	const user = await requireUser(userId);

	if (!user.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	if (user.services?.totp?.enabled) {
		throw new Meteor.Error('error-2fa-already-enabled');
	}

	const secret = TOTP.generateSecret();

	await Users.disable2FAAndSetTempSecretByUserId(user._id, secret.base32);

	return {
		secret: secret.base32,
		url: TOTP.generateOtpauthURL(secret, user.username),
	};
};

export const disableTotp = async (userId: string | null, code: string): Promise<boolean> => {
	const user = await requireUser(userId);

	if (!user.services?.totp?.enabled) {
		return false;
	}

	const verified = await TOTP.verify({
		secret: user.services.totp.secret,
		token: code,
		userId: user._id,
		backupTokens: user.services.totp.hashedBackup,
	});

	if (!verified) {
		return false;
	}

	const { modifiedCount } = await Users.disable2FAByUserId(user._id);

	if (!modifiedCount) {
		return false;
	}

	void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: { 'services.totp.enabled': false } });

	return true;
};

export const validateTotpTempToken = async (userId: string | null, userToken: string, authToken?: string): Promise<{ codes: string[] }> => {
	const user = await requireUser(userId);

	if (!user.services?.totp?.tempSecret) {
		throw new Meteor.Error('invalid-totp');
	}

	const verified = await TOTP.verify({
		secret: user.services.totp.tempSecret,
		token: userToken,
	});
	if (!verified) {
		throw new Meteor.Error('invalid-totp');
	}

	const { codes, hashedCodes } = TOTP.generateCodes();

	await Users.enable2FAAndSetSecretAndCodesByUserId(user._id, user.services.totp.tempSecret, hashedCodes);

	if (authToken) {
		const hashedToken = Accounts._hashLoginToken(authToken);

		const { modifiedCount } = await Users.removeNonPATLoginTokensExcept(user._id, hashedToken);

		if (modifiedCount > 0) {
			void notifyOnUserChangeAsync(async () => {
				const refreshed = await Users.findOneById(user._id, {
					projection: { 'services.resume.loginTokens': 1, 'services.totp': 1 },
				});
				return {
					clientAction: 'updated',
					id: user._id,
					diff: {
						'services.resume.loginTokens': refreshed?.services?.resume?.loginTokens,
						...(refreshed?.services?.totp && { 'services.totp.enabled': refreshed.services.totp.enabled }),
					},
				};
			});
		} else {
			void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: { 'services.totp.enabled': true } });
		}
	} else {
		void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: { 'services.totp.enabled': true } });
	}

	return { codes };
};

export const regenerateTotpCodes = async (userId: string | null, userToken: string): Promise<{ codes: string[] } | undefined> => {
	const user = await requireUser(userId);

	if (!user.services?.totp?.enabled) {
		throw new Meteor.Error('invalid-totp');
	}

	const verified = await TOTP.verify({
		secret: user.services.totp.secret,
		token: userToken,
		userId: user._id,
		backupTokens: user.services.totp.hashedBackup,
	});

	if (!verified) {
		return undefined;
	}

	const { codes, hashedCodes } = TOTP.generateCodes();

	await Users.update2FABackupCodesByUserId(user._id, hashedCodes);

	return { codes };
};

export const codesRemainingTotp = async (userId: string | null): Promise<{ remaining: number }> => {
	const user = await requireUser(userId);

	if (!user.services?.totp?.enabled) {
		throw new Meteor.Error('invalid-totp');
	}

	return {
		remaining: user.services.totp.hashedBackup?.length ?? 0,
	};
};
