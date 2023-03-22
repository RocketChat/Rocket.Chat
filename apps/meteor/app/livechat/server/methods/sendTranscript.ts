import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Users } from '../../../models/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/LivechatTyped';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:sendTranscript'(token: string, rid: string, email: string, subject: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:sendTranscript'(token, rid, email, subject) {
		check(rid, String);
		check(email, String);

		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'send-omnichannel-chat-transcript'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:sendTranscript',
			});
		}

		const user = Users.findOneById(uid, {
			fields: { _id: 1, username: 1, name: 1, utcOffset: 1 },
		});
		return Livechat.sendTranscript({ token, rid, email, subject, user });
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'livechat:sendTranscript',
		connectionId() {
			return true;
		},
	},
	1,
	5000,
);
