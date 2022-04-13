import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';

import { LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';
import { settings } from '../../../settings/server';

Meteor.methods({
	sendMessageLivechat({ token, _id, rid, msg, file, attachments }, agent) {
		check(token, String);
		check(_id, String);
		check(rid, String);
		check(msg, String);

		check(
			agent,
			Match.Maybe({
				agentId: String,
				username: String,
			}),
		);

		const guest = LivechatVisitors.getVisitorByToken(token, {
			fields: {
				name: 1,
				username: 1,
				department: 1,
				token: 1,
			},
		});

		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		if (
			settings.get('Livechat_enable_message_character_limit') &&
			msg.length > parseInt(settings.get('Livechat_message_character_limit'))
		) {
			throw new Meteor.Error('message-length-exceeds-character-limit');
		}

		return Livechat.sendMessage({
			guest,
			message: {
				_id,
				rid,
				msg,
				token,
				file,
				attachments,
			},
			agent,
			roomInfo: {
				source: {
					type: OmnichannelSourceType.API,
				},
			},
		});
	},
});
