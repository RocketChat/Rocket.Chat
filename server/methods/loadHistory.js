import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';
import { hasPermission } from '../../app/authorization';
import { settings } from '../../app/settings';
import { loadMessageHistory, loadNewsfeedHistory } from '../../app/lib';

const hideMessagesOfType = [];

settings.get(/Message_HideType_.+/, function(key, value) {
	const type = key.replace('Message_HideType_', '');
	const types = type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type];

	return types.forEach((type) => {
		const index = hideMessagesOfType.indexOf(type);

		if (value === true && index === -1) {
			return hideMessagesOfType.push(type);
		}

		if (index > -1) {
			return hideMessagesOfType.splice(index, 1);
		}
	});
});

Meteor.methods({
	loadHistory(rid, end, limit = 20, ls) {
		check(rid, String);

		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory',
			});
		}

		const fromId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromId);

		if (!room) {
			return false;
		}

		if (room.t === 'n') {
			return loadNewsfeedHistory({ userId: fromId, end, limit, ls });
		}

		const canAnonymous = settings.get('Accounts_AllowAnonymousRead');
		const canPreview = hasPermission(fromId, 'preview-c-room');

		if (room.t === 'c' && !canAnonymous && !canPreview && !Subscriptions.findOneByRoomIdAndUserId(rid, fromId, { fields: { _id: 1 } })) {
			return false;
		}

		return loadMessageHistory({ userId: fromId, rid, end, limit, ls });
	},
});
