import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import _ from 'underscore';
import MentionsServer from './Mentions';

const mention = new MentionsServer({
	pattern: () => RocketChat.settings.get('UTF8_Names_Validation'),
	messageMaxAll: () => RocketChat.settings.get('Message_MaxAll'),
	getUsers: (usernames) => Meteor.users.find({ username: { $in: _.unique(usernames) } }, { fields: { _id: true, username: true, name: 1 } }).fetch(),
	getUser: (userId) => RocketChat.models.Users.findOneById(userId),
	getTotalChannelMembers: (rid) => RocketChat.models.Subscriptions.findByRoomId(rid).count(),
	getChannels: (channels) => RocketChat.models.Rooms.find({ name: { $in: _.unique(channels) }, t: { $in: ['c', 'p'] }	}, { fields: { _id: 1, name: 1 } }).fetch(),
	onMaxRoomMembersExceeded({ sender, rid }) {
		// Get the language of the user for the error notification.
		const { language } = this.getUser(sender._id);
		const msg = TAPi18n.__('Group_mentions_disabled_x_members', { total: this.messageMaxAll }, language);

		RocketChat.Notifications.notifyUser(sender._id, 'message', {
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
RocketChat.callbacks.add('beforeSaveMessage', (message) => mention.execute(message), RocketChat.callbacks.priority.HIGH, 'mentions');
