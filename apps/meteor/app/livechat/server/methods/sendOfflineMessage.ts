import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:sendOfflineMessage'(data: { name: string; email: string; message: string }): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:sendOfflineMessage'(data) {
		methodDeprecationLogger.method('livechat:sendOfflineMessage', '7.0.0');

		check(data, {
			name: String,
			email: String,
			message: String,
		});

		await Livechat.sendOfflineMessage(data);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'livechat:sendOfflineMessage',
		connectionId() {
			return true;
		},
	},
	1,
	5000,
);
