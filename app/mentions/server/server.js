import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import MentionsServer from './Mentions';
import { settings } from '../../settings';
import { callbacks } from '../../../lib/callbacks';
import { Users, Subscriptions, Rooms } from '../../models';
import { api } from '../../../server/sdk/api';

export class MentionQueries {
	getUsers(usernames) {
		const users = Meteor.users
			.find({ username: { $in: [...new Set(usernames)] } }, { fields: { _id: true, username: true, name: 1 } })
			.fetch();

		return users.map((user) => ({
			...user,
			type: 'user',
		}));
	}

	getUser(userId) {
		return Users.findOneById(userId);
	}

	getTotalChannelMembers(rid) {
		return Subscriptions.findByRoomId(rid).count();
	}

	getChannels(channels) {
		return Rooms.find({ name: { $in: [...new Set(channels)] }, t: { $in: ['c', 'p'] } }, { fields: { _id: 1, name: 1 } }).fetch();
	}
}

const queries = new MentionQueries();

const mention = new MentionsServer({
	pattern: () => settings.get('UTF8_User_Names_Validation'),
	messageMaxAll: () => settings.get('Message_MaxAll'),
	getUsers: (usernames) => queries.getUsers(usernames),
	getUser: (userId) => queries.getUser(userId),
	getTotalChannelMembers: (rid) => queries.getTotalChannelMembers(rid),
	getChannels: (channels) => queries.getChannels(channels),
	onMaxRoomMembersExceeded({ sender, rid }) {
		// Get the language of the user for the error notification.
		const { language } = this.getUser(sender._id);
		const msg = TAPi18n.__('Group_mentions_disabled_x_members', { total: this.messageMaxAll }, language);

		api.broadcast('notify.ephemeralMessage', sender._id, rid, {
			msg,
		});

		// Also throw to stop propagation of 'sendMessage'.
		throw new Meteor.Error('error-action-not-allowed', msg, {
			method: 'filterATAllTag',
			action: msg,
		});
	},
});
callbacks.add('beforeSaveMessage', (message) => mention.execute(message), callbacks.priority.HIGH, 'mentions');
