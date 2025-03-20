import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { RateLimiter, validateEmailDomain } from '../lib';
import { checkEmailAvailability } from './checkEmailAvailability';
import { sendConfirmationEmail } from '../../../../server/methods/sendConfirmationEmail';

let html = '';
Meteor.startup(() => {
	Mailer.getTemplate('Email_Changed_Email', (template) => {
		html = template;
	});
});

const _sendEmailChangeNotification = async function (to: string, newEmail: string) {
	const subject = String(settings.get('Email_Changed_Email_Subject'));
	const email = {
		to,
		from: String(settings.get('From_Email')),
		subject,
		html,
		data: {
			email: escapeHTML(newEmail),
		},
	};

	try {
		await Mailer.send(email);
	} catch (error: any) {
		throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
			function: 'setEmail',
			message: error.message,
		});
	}
};

const _setEmail = async function (
	userId: string,
	email: string,
	shouldSendVerificationEmail = true,
	verified = false,
	updater?: Updater<IUser>,
	session?: ClientSession,
) {
	email = email.trim();
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
	}

	if (!email) {
		throw new Meteor.Error('error-invalid-email', 'Invalid email', { function: '_setEmail' });
	}

	await validateEmailDomain(email);

	const user = await Users.findOneById(userId, { session });
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
	}

	// User already has desired username, return
	if (user?.emails?.[0] && user.emails[0].address === email) {
		return user;
	}

	// Check email availability
	if (!(await checkEmailAvailability(email))) {
		throw new Meteor.Error('error-field-unavailable', `${email} is already in use :(`, {
			function: '_setEmail',
			field: email,
		});
	}

	const oldEmail = user?.emails?.[0];

	if (oldEmail) {
		await onceTransactionCommitedSuccessfully(async () => {
			await _sendEmailChangeNotification(oldEmail.address, email);
		}, session);
	}

	// Set new email
	if (updater) {
		updater.set('emails', [{ address: email, verified }]);
	} else {
		await Users.setEmail(user?._id, email, verified, { session });
	}

	const result = {
		...user,
		email,
	};
	if (shouldSendVerificationEmail === true) {
		await onceTransactionCommitedSuccessfully(async () => {
			await sendConfirmationEmail(result.email);
		}, session);
	}
	return result;
};

export const setEmail = RateLimiter.limitFunction(_setEmail, 1, 60000, {
	async 0() {
		const userId = Meteor.userId();
		return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
	}, // Administrators have permission to change others emails, so don't limit those
});
