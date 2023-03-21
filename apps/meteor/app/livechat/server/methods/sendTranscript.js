import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Users } from '../../../models/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/LivechatTyped';

Meteor.methods({
	async 'livechat:sendTranscript'(token, rid, email, subject) {
		check(rid, String);
		check(email, String);

		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'send-omnichannel-chat-transcript'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:sendTranscript',
			});
		}

		const user = Users.findOneById(Meteor.userId(), {
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
