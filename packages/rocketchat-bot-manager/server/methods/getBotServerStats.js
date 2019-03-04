import { Meteor } from 'meteor/meteor';
import * as Models from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';

Meteor.methods({
	async getBotServerStats(bot) {
		if (!hasPermission(Meteor.userId(), 'manage-bot-account')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotServerStats',
			});
		}

		if (!bot) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getBotServerStats' });
		}

		const server = {};
		server.totalMessages = Models.Messages.find({ 'u.username': bot.username }).count();
		server.mentionCount = Models.Messages.findByMention(bot.username).count();
		server.roomCount = Models.Rooms.findWithUsername(bot.username).count();
		return { server };
	},
});
