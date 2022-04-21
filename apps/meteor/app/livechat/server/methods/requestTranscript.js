import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:requestTranscript'(rid, email, subject) {
		check(rid, String);
		check(email, String);

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'send-omnichannel-chat-transcript')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:requestTranscript',
			});
		}

		const user = Users.findOneById(Meteor.userId(), {
			fields: { _id: 1, username: 1, name: 1, utcOffset: 1 },
		});
		return Livechat.requestTranscript({ rid, email, subject, user });
	},
});
