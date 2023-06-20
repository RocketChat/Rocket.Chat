import { Meteor } from 'meteor/meteor';
import { LivechatVisitors, Users } from '@rocket.chat/models';
import type { IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
// import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import { validateEmailDomain } from '../lib';
import { checkEmailAvailability } from '.';
import { sendMessage } from './sendMessage';
import { i18n } from '../../../../server/lib/i18n';

interface ISetVisitorEmailResult {
	success: boolean;
	error?: Error | undefined;
}

export const setVisitorEmail = async function (room: IOmnichannelGenericRoom, email: string): Promise<ISetVisitorEmailResult> {
	try {
		const userId = room.v._id;
		const bot = await Users.findOneById('rocket.cat');
		email = email.trim();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
		}

		if (!email) {
			throw new Meteor.Error('error-invalid-email', 'Invalid email', { function: '_setEmail' });
		}

		try {
			await validateEmailDomain(email);
		} catch (error) {
			const message = {
				msg: i18n.t('Sorry, this is not a valid email, kindly provide another input'),
				groupable: false,
			};
			await sendMessage(bot, message, room);
			// console.error('Failed to update email:', error);
			// throw new Meteor.Error('error-invalid-email-domain', 'Invalid email domain');
			return { success: false, error: error as Error };
		}

		const visitor = await LivechatVisitors.findOneById(userId, {});
		if (!visitor) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
		}

		// User already has desired email, return
		if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address === email) {
			return { success: true };
		}

		// Check email availability
		if (!(await checkEmailAvailability(email))) {
			throw new Meteor.Error('error-field-unavailable', `${email} is already in use :(`, {
				function: '_setEmail',
				field: email,
			});
		}

		// Set new email
		const updateVisitor = {
			$set: {
				visitorEmails: [
					{
						address: email,
					},
				],
			},
		};
		await LivechatVisitors.updateById(userId, updateVisitor);
		const result = {
			success: true,
		};
		return result;
	} catch (error) {
		console.error('Failed to update email:', error);
		return { success: false, error: error as Error };
	}
};

// export const setVisitorEmail = RateLimiter.limitFunction(_setVisitorEmail, 1, 60000, {
// 	async 0() {
// 		const userId = Meteor.userId();
// 		return !userId;
// 	}, // Administrators have permission to change others emails, so don't limit those
// });
