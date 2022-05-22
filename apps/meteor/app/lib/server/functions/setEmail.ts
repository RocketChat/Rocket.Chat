/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { Users } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';
import { RateLimiter, validateEmailDomain } from '../lib';
import * as Mailer from '../../../mailer';
import { settings } from '../../../settings/server';
import { checkEmailAvailability } from '.';

let html = '';
Meteor.startup(() => {
	Mailer.getTemplate('Email_Changed_Email', (template) => {
		html = template;
	});
});

const _sendEmailChangeNotification = function (to: string, newEmail: string) {
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
		Mailer.send(email);
	} catch (error: any) {
		throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
			function: 'setEmail',
			message: error.message,
		});
	}
};

const _setEmail = function (userId: string, email: string, shouldSendVerificationEmail = true) {
	email = s.trim(email);
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
	}

	if (!email) {
		throw new Meteor.Error('error-invalid-email', 'Invalid email', { function: '_setEmail' });
	}

	validateEmailDomain(email);

	const user = Users.findOneById(userId);

	// User already has desired username, return
	if (user.emails && user.emails[0] && user.emails[0].address === email) {
		return user;
	}

	// Check email availability
	if (!checkEmailAvailability(email)) {
		throw new Meteor.Error('error-field-unavailable', `${email} is already in use :(`, {
			function: '_setEmail',
			field: email,
		});
	}

	const oldEmail = user.emails && user.emails[0];

	if (oldEmail) {
		_sendEmailChangeNotification(oldEmail.address, email);
	}

	// Set new email
	Users.setEmail(user._id, email);
	user.email = email;
	if (shouldSendVerificationEmail === true) {
		Meteor.call('sendConfirmationEmail', user.email);
	}
	return user;
};

export const setEmail = RateLimiter.limitFunction(_setEmail, 1, 60000, {
	0() {
		const userId = Meteor.userId();
		return !userId || !hasPermission(userId, 'edit-other-user-info');
	}, // Administrators have permission to change others emails, so don't limit those
});
