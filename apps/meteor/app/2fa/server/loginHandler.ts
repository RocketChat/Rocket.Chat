import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';
import { check } from 'meteor/check';

import { callbacks } from '../../../lib/callbacks';
import { checkCodeForUser } from './code/index';

const isMeteorError = (error: any): error is Meteor.Error => {
	return error?.meteorError !== undefined;
};

const isCredentialWithError = (credential: any): credential is { error: Error } => {
	return credential?.error !== undefined;
};

Accounts.registerLoginHandler('totp', function (options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	// @ts-expect-error - not sure how to type this yet
	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add(
	'onValidateLogin',
	(login) => {
		if (login.type === 'resume' || login.type === 'proxy' || login.methodName === 'verifyEmail') {
			return login;
		}
		// CAS login doesn't yet support 2FA.
		if (login.type === 'cas') {
			return login;
		}

		if (!login.user) {
			return login;
		}

		const [loginArgs] = login.methodArguments;
		const { totp } = loginArgs;

		checkCodeForUser({
			user: login.user,
			code: totp?.code,
			options: { disablePasswordFallback: true },
		});

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

OAuth._retrievePendingCredential = function (key, ...args): string | Error | void {
	const credentialSecret = args.length > 0 && args[0] !== undefined ? args[0] : undefined;
	check(key, String);

	const pendingCredential = OAuth._pendingCredentials.findOne({
		key,
		credentialSecret,
	});

	if (!pendingCredential) {
		return;
	}

	if (isCredentialWithError(pendingCredential.credential)) {
		OAuth._pendingCredentials.remove({
			_id: pendingCredential._id,
		});
		return recreateError(pendingCredential.credential.error);
	}

	// Work-around to make the credentials reusable for 2FA
	const future = new Date();
	future.setMinutes(future.getMinutes() + 2);

	OAuth._pendingCredentials.update(
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
