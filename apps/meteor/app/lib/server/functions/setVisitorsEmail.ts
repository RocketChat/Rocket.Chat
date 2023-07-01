import { LivechatVisitors, Users } from '@rocket.chat/models';
import type { IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
// import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import { validateEmailDomain } from '../lib';
import { checkEmailAvailability } from '.';
import { Logger } from '../../../logger/server';
import { sendMessage } from './sendMessage';
import { i18n } from '../../../../server/lib/i18n';

interface ISetVisitorEmailResult {
	success: boolean;
	error?: Error | undefined;
}

const logger = new Logger('updateEmail');

export const setVisitorEmail = async function (room: IOmnichannelGenericRoom, email: string): Promise<ISetVisitorEmailResult> {
	try {
		const userId = room.v._id;
		const bot = await Users.findOneById('rocket.cat');
		email = email.trim();
		if (!userId) {
			throw new Error('error-invalid-user');
		}

		if (!email) {
			throw new Error('error-email-required');
		}

		try {
			await validateEmailDomain(email);
		} catch (error) {
			const message = {
				msg: i18n.t('Sorry, this is not a valid email, kindly provide another input'),
				groupable: false,
			};
			await sendMessage(bot, message, room);
			return { success: false, error: error as Error };
		}

		const visitor = await LivechatVisitors.findOneById(userId, {});
		if (!visitor) {
			throw new Error('error-invalid-user');
		}

		// User already has desired email, return
		if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address === email) {
			return { success: true };
		}

		// Check email availability
		if (!(await checkEmailAvailability(email))) {
			throw new Error('error-email-unavailable');
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
		logger.error({ msg: 'Failed to update email :', error });
		return { success: false, error: error as Error };
	}
};
