import { Omnichannel } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RateLimiter } from '../../../lib/server';
import { sendTranscript } from '../lib/sendTranscript';

declare module '@rocket.chat/ddp-client' {
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

		const user = await Users.findOneById(uid, {
			projection: { _id: 1, username: 1, name: 1, utcOffset: 1 },
		});

		const room = await LivechatRooms.findOneById(rid, { projection: { activity: 1 } });
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:sendTranscript' });
		}
		if (!(await Omnichannel.isWithinMACLimit(room))) {
			throw new Meteor.Error('error-mac-limit-reached', 'MAC limit reached', { method: 'livechat:sendTranscript' });
		}

		return sendTranscript({ token, rid, email, subject, user });
	},
});

RateLimiter.limitMethod('livechat:sendTranscript', 1, 5000, {
	connectionId() {
		return true;
	},
});
