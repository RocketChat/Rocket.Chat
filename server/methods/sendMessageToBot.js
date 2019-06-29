import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { HTTP } from 'meteor/http';

import { Messages } from '../../app/models';
import Rooms from '../../app/models/server/models/Rooms';
import Users from '../../app/models/server/models/Users';


Meteor.methods({
	sendMessageToBot(type, userId, payload) {
		check(type, String);
		check(userId, String);

		const user = Users.findOneById(userId, { fields: { services: 0 } });
		if (!user) {
			throw new Meteor.Error(`No user found with the id of "${ userId }".`);
		}

		if (!payload.actions) {
			throw new Meteor.Error('The required "actions" param is missing.');
		}

		const { msgId, botId, roomId } = payload;

		const msg = Messages.findOneById(msgId);
		if (!msg) {
			throw new Meteor.Error(`No message found with the id of "${ msgId }".`);
		}

		const room = Rooms.findOneById(roomId, { fields: { t: 0, ts: 0, lastMessage: 0 } });
		if (!room) {
			throw new Meteor.Error(`No Room found with the id of "${ roomId }".`);
		}

		const bot = Users.findOneById(botId, { fields: { services: 0 } });
		if (!bot || !bot.roles.includes('bot')) {
			throw new Meteor.Error(`No bot found with the id of "${ botId }".`);
		}

		if (!bot.customFields || !bot.customFields.webHookUrl) {
			throw new Meteor.Error('No webhookUrl is set for this bot.');
		}

		const interactive_payload = {};
		interactive_payload.type = type;
		interactive_payload.user = user;
		interactive_payload.room = room;
		interactive_payload.original_message = msg;
		interactive_payload.actions = payload.actions;

		const { webHookUrl } = bot.customFields;
		try {
			HTTP.call('POST', webHookUrl, {
				data: interactive_payload,
			});
			return interactive_payload;
		} catch (e) {
			return false;
		}
	},
});
