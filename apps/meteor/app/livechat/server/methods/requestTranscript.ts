import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users } from '../../../models/server';
import { Livechat } from '../lib/Livechat';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

Meteor.methods({
	async 'livechat:requestTranscript'(rid: string, email: string, subject: string) {
		check(rid, String);
		check(email, String);

		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'send-omnichannel-chat-transcript'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:requestTranscript',
			});
		}

		const user = Users.findOneById(userId, {
			fields: { _id: 1, username: 1, name: 1, utcOffset: 1 },
		});

		await Livechat.requestTranscript({ rid, email, subject, user });

		return true;
	},
});
