import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { AppsTokens } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from './i18n';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { RateLimiter } from '../../app/lib/server/lib';
import { Push } from '../../app/push/server';
import { settings } from '../../app/settings/server';

export const executePushTest = async (userId: IUser['_id'], username: IUser['username']): Promise<number> => {
	const tokens = await AppsTokens.countTokensByUserId(userId);

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

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		push_test(): { message: string; params: number[] };
	}
}

Meteor.methods<ServerMethods>({
	async push_test() {
		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'push_test',
			});
		}

		if (!(await hasPermissionAsync(user._id, 'test-push-notifications'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'push_test',
			});
		}

		if (settings.get('Push_enable') !== true) {
			throw new Meteor.Error('error-push-disabled', 'Push is disabled', {
				method: 'push_test',
			});
		}

		const tokensCount = await executePushTest(user._id, user.username);
		return {
			message: 'Your_push_was_sent_to_s_devices',
			params: [tokensCount],
		};
	},
});

RateLimiter.limitMethod('push_test', 1, 1000, {
	userId: () => true,
});
