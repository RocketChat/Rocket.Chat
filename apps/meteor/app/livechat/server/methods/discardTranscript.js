import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { LivechatRooms } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization';

Meteor.methods({
	'livechat:discardTranscript'(rid) {
		check(rid, String);

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'send-omnichannel-chat-transcript')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:requestTranscript',
			});
		}

		const room = Promise.await(LivechatRooms.findOneById(rid));
		if (!room || !room.open) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:discardTranscript',
			});
		}

		if (!room.transcriptRequest) {
			throw new Meteor.Error('error-transcript-not-requested', 'No transcript requested for this chat', {
				method: 'livechat:discardTranscript',
			});
		}

		Promise.await(LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid));

		return true;
	},
});
