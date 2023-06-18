import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';

import { RateLimiter, validateEmailDomain } from '../lib';
import { checkEmailAvailability } from '.';

const _setVisitorEmail = async function (userId: string, email: string) {
	email = email.trim();
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
	}

	if (!email) {
		throw new Meteor.Error('error-invalid-email', 'Invalid email', { function: '_setEmail' });
	}

	await validateEmailDomain(email);

	const visitor = await LivechatVisitors.findOneById(userId, {});
	if (!visitor) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
	}

	// User already has desired username, return
	if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address === email) {
		return visitor;
	}

	// Check email availability
	if (!(await checkEmailAvailability(email))) {
		throw new Meteor.Error('error-field-unavailable', `${email} is already in use :(`, {
			function: '_setEmail',
			field: email,
		});
	}

	// Set new email
	const updateUser = {
		$set: {
			visitorEmails: [
				{
					address: email,
				},
			],
		},
	};
	await LivechatVisitors.updateById(userId, updateUser);
	const result = {
		...visitor,
		email,
	};
	return result;
};

export const setVisitorEmail = RateLimiter.limitFunction(_setVisitorEmail, 1, 60000, {
	async 0() {
		const userId = Meteor.userId();
		return !userId;
	}, // Administrators have permission to change others emails, so don't limit those
});
