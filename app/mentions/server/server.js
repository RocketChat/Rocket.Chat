import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import MentionsServer from './Mentions';
import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { Users, Subscriptions, Rooms } from '../../models';
import { api } from '../../../server/sdk/api';

const mention = new MentionsServer({
	pattern: () => settings.get('UTF8_Names_Validation'),
	messageMaxAll: () => settings.get('Message_MaxAll'),
	getUsers: (usernames) => Meteor.users.find({ username: { $in: _.unique(usernames) } }, { fields: { _id: true, username: true, name: 1 } }).fetch(),
	getUser: (userId) => Users.findOneById(userId),
	getTotalChannelMembers: (rid) => Subscriptions.findByRoomId(rid).count(),
	getChannels: (channels) => Rooms.find({ name: { $in: _.unique(channels) }, t: { $in: ['c', 'p'] } }, { fields: { _id: 1, name: 1 } }).fetch(),
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
