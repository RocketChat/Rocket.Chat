import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { settings } from 'meteor/rocketchat:settings';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { Notifications } from 'meteor/rocketchat:notifications';
import { Users, Subscriptions, Rooms } from 'meteor/rocketchat:models';
import _ from 'underscore';
import MentionsServer from './Mentions';

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

		Notifications.notifyUser(sender._id, 'message', {
			_id: Random.id(),
			rid,
			ts: new Date,
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
