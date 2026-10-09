import type { IUser } from '@rocket.chat/core-typings';
import { PushToken } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from './i18n';
import { Push } from './notifications/push';

export const executePushTest = async (userId: IUser['_id'], username: IUser['username']): Promise<number> => {
	const tokens = await PushToken.countTokensByUserId(userId);

	if (tokens === 0) {
		throw new Meteor.Error('error-no-tokens-for-this-user', 'There are no tokens for this user', {
			method: 'push_test',
		});
	}

	await Push.send({
		from: 'push',
		title: `@${username}`,
		text: i18n.t('This_is_a_push_test_messsage'),
		sound: 'default',
		userId,
	});

	return tokens;
};
