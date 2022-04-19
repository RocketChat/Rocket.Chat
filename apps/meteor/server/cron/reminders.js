import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import moment from 'moment';

import { Messages, Rooms } from '../../app/models';
import { t } from '../../app/utils';

export function createCronReminder(messageId, reminder, rid) {
	if (!rid) {
		rid = Meteor.call('createDirectMessage', 'rocket.reminder').rid;
	}
	const { cronId, ttr, permalink } = reminder;
	const job = () => {
		try {
			SyncedCron.remove(cronId);
			Messages.deleteRemind(messageId, cronId);
			Meteor.runAsUser('rocket.reminder', async () => {
				Meteor.call('sendMessage', { rid, ttr, msg: t('Message_Reminder_Text', permalink) });
			});
		} catch (error) {
			console.log(error);
		}
	};

	return SyncedCron.add({
		name: cronId,
		schedule(parser) {
			return parser.recur().on(ttr).fullDate();
		},
		job,
	});
}

export function restartReminderCrons() {
	const query = {
		reminders: { $exists: 1 },
	};
	try {
		Messages.find(query)
			.fetch()
			.forEach((message) => {
				message.reminders.forEach((reminder) => {
					const room = Rooms.findOneDirectRoomContainingAllUserIDs(['rocket.reminder', reminder.uid]);
					if (moment().isAfter(moment(reminder.ttr))) {
						Meteor.runAsUser('rocket.reminder', async () => {
							Meteor.call('sendMessage', {
								rid: room._id,
								ttr: reminder.ttr,
								msg: t('Message_Reminder_Apologize', reminder.permalink),
							});
						});
						return Messages.deleteRemind(message._id, reminder.cronId);
					}
					createCronReminder(message._id, reminder, room._id);
				});
			});
	} catch (error) {
		console.log(error);
	}
}
