import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { CredentialTokens, Users } from '@rocket.chat/models';

import { checkCodeForUser } from './code';
import { callbacks } from '../callbacks';

const isMeteorError = (error: any): error is Meteor.Error => {
	return error?.meteorError !== undefined;
};

const isCredentialWithError = (credential: any): credential is { error: Error } => {
	return credential?.error !== undefined;
};

Accounts.registerLoginHandler('totp', function (options) {
	if (!options.totp?.code) {
		return;
	}

	// @ts-expect-error - not sure how to type this yet
	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add(
	'onValidateLogin',
	async (login) => {
		if (
			!login.user ||
			login.type === 'resume' ||
			login.type === 'proxy' ||
			login.type === 'cas' ||
			(login.type === 'password' && login.methodName === 'resetPassword') ||
			login.methodName === 'verifyEmail'
		) {
			return login;
		}

		const [loginArgs] = login.methodArguments;
		const { totp } = loginArgs;

		await checkCodeForUser({
			user: login.user,
			code: totp?.code,
			options: { disablePasswordFallback: true },
		});

		// Clean up any pending SAML credential token after successful 2FA verification.
		// The SAML login handler stores the token on the user to prevent premature deletion
		// before the second method.callAnon/login call (which carries the TOTP code).
		const pendingToken = (login.user as any).services?.saml?.pendingCredentialToken;
		if (pendingToken) {
			await CredentialTokens.removeById(pendingToken);
			await Users.updateOne(
				{ _id: login.user._id },
				{
					$unset: {
						'services.saml.pendingCredentialToken': '',
						'services.saml.pendingCredentialExpiresAt': '',
					},
				},
			);
		}

		return login;
	},
	callbacks.priority.MEDIUM,
	'2fa',
);

const copyTo = <T extends Error>(from: T, to: T): T => {
	Object.getOwnPropertyNames(to).forEach((key) => {
		const idx: keyof T = key as keyof T;
		to[idx] = from[idx];
	});

	return to;
};

const recreateError = (errorDoc: Error | Meteor.Error): Error | Meteor.Error => {
	if (isMeteorError(errorDoc)) {
		const error = new Meteor.Error('');
		return copyTo(errorDoc, error);
	}

	const error = new Error();
	return copyTo(errorDoc, error);
};

OAuth._retrievePendingCredential = async function (key, ...args): Promise<string | Error | void> {
	const credentialSecret = args.length > 0 && args[0] !== undefined ? args[0] : undefined;
	check(key, String);

	const pendingCredential = await OAuth._pendingCredentials.findOneAsync({
		key,
		credentialSecret,
	});

	if (!pendingCredential) {
		return;
	}

	if (isCredentialWithError(pendingCredential.credential)) {
		await OAuth._pendingCredentials.removeAsync({
			_id: pendingCredential._id,
		});
		return recreateError(pendingCredential.credential.error);
	}

	// Work-around to make the credentials reusable for 2FA
	const future = new Date();
	future.setMinutes(future.getMinutes() + 2);

	await OAuth._pendingCredentials.updateAsync(
		{
			_id: pendingCredential._id,
		},
		{
			$set: {
				createdAt: future,
			},
		},
	);

	return OAuth.openSecret(pendingCredential.credential);
};
