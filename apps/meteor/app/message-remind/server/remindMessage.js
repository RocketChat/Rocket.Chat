import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { settings } from '../../settings';
import { Subscriptions, Messages } from '../../models';
import { createCronReminder } from '../../../server/cron/reminders';

Meteor.methods({
	remindMessage(message, reminder) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'remindMessage',
			});
		}

		if (!settings.get('Message_AllowRemind')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message remind not allowed', {
				method: 'remindMessage',
				action: 'Remind_Message',
			});
		}
		const subscription = Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}

		if (!Messages.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			return false;
		}

		if (!reminder.ttr) {
			throw new Meteor.Error('Error', 'Time to remind (ttr) must be defined', {
				method: 'remindMessage',
			});
		}

		try {
			reminder.cronId = Random.id();
			reminder.uid = Meteor.userId();
			Messages.createRemind(message._id, reminder);
			createCronReminder(message._id, reminder);
		} catch (error) {
			throw new Meteor.Error('Error', error, {
				method: 'remindMessage',
			});
		}
	},
});
