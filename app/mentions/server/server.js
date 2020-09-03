import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import MentionsServer from './Mentions';
import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { Notifications } from '../../notifications';
import { Users, Subscriptions, Rooms } from '../../models';

const mention = new MentionsServer({
	pattern: () => settings.get('UTF8_Names_Validation'),
	messageMaxAll: () => settings.get('Message_MaxAll'),
	getUser: (userId) => Users.findOneById(userId),
	getTotalChannelMembers: (rid) => Subscriptions.findByRoomId(rid).count(),
	getChannels(channels) {
		const fields = { fields: { _id: 1, name: 1 } };
		const query = { name: { $in: _.unique(channels) }, t: { $in: ['c', 'p'] } };

		try {
			const { customFields: { groupId } = {} } = Meteor.user() || {};
			if (groupId) {
				query.groupId = { $in: [groupId, null] };
			}
		} catch { /**/ }

		Rooms.find(query, fields).fetch();
	},
	getUsers(usernames) {
		const fields = { _id: true, username: true, name: 1 };
		const query = { username: { $in: _.unique(usernames) } };

		try {
			const { customFields: { groupId } = {} } = Meteor.user() || {};
			if (groupId) {
				query['customFields.groupId'] = { $in: [groupId, null] };
			}
		} catch { /**/ }

		const result = Meteor.users.find(query, fields).fetch();
		return result;
	},
	onMaxRoomMembersExceeded({ sender, rid }) {
		// Get the language of the user for the error notification.
		const { language } = this.getUser(sender._id);
		const msg = TAPi18n.__('Group_mentions_disabled_x_members', { total: this.messageMaxAll }, language);

		Notifications.notifyUser(sender._id, 'message', {
			_id: Random.id(),
			rid,
			ts: new Date(),
			msg,
			groupable: false,
		});

		// Also throw to stop propagation of 'sendMessage'.
		throw new Meteor.Error('error-action-not-allowed', msg, {
			method: 'filterATAllTag',
			action: msg,
		});
	},
});
callbacks.add('beforeSaveMessage', (message) => mention.execute(message), callbacks.priority.HIGH, 'mentions');
