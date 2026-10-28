import { isClientSafeError, ClientSafeError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';

import { trim } from '../../../lib/utils/stringUtils';
import { passwordPolicy } from '../../lib/auth/passwordPolicy';
import { validateInviteToken } from '../../lib/rooms/invites/validateInviteToken';
import { validateEmailDomain } from '../../lib/validateEmailDomain';
import { settings } from '../../settings';

export const registerUser = async (formData: {
	email: string;
	pass: string;
	username: IUser['username'];
	name?: string;
	secretURL?: string;
	reason?: string;
}): Promise<string> => {
	const manuallyApproveNewUsers = settings.get<boolean>('Accounts_ManuallyApproveNewUsers');
	check(
		formData,
		Match.ObjectIncluding({
			email: String,
			pass: String,
			name: String,
			secretURL: Match.Optional(String),
			reason: Match.Optional(String),
		}),
	);

	if (settings.get('Accounts_RegistrationForm') === 'Disabled') {
		throw new ClientSafeError('error-user-registration-disabled', 'User registration is disabled', {
			method: 'registerUser',
		});
	}

	if (
		settings.get('Accounts_RegistrationForm') === 'Secret URL' &&
		(!formData.secretURL || formData.secretURL !== settings.get('Accounts_RegistrationForm_SecretURL'))
	) {
		if (!formData.secretURL) {
			throw new ClientSafeError('error-user-registration-secret', 'User registration is only allowed via Secret URL', {
				method: 'registerUser',
			});
		}

		try {
			await validateInviteToken(formData.secretURL);
		} catch (e) {
			throw new ClientSafeError('error-user-registration-secret', 'User registration is only allowed via Secret URL', {
				method: 'registerUser',
			});
		}
	}

	passwordPolicy.validate(formData.pass);

	await validateEmailDomain(formData.email);

	const userData = {
		email: trim(formData.email.toLowerCase()),
		password: formData.pass,
		...(formData.name?.trim() && { name: formData.name?.trim() }),
		reason: formData.reason,
	};

	let userId;
	try {
		userId = await Accounts.createUserAsync(userData);
	} catch (e) {
		if (isClientSafeError(e)) {
			throw e;
		}

		if (e instanceof Error) {
			throw new ClientSafeError(e.message);
		}

		throw new ClientSafeError(String(e));
	}

	const reason = trim(formData.reason);
	if (manuallyApproveNewUsers && reason) {
		await Users.setReason(userId, reason);
	}

	try {
		Accounts.sendVerificationEmail(userId, userData.email);
	} catch (error) {
		// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
	}

	return userId;
};
