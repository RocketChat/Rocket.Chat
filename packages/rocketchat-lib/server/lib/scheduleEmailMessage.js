import later from 'later';

const FutureEmails = new Meteor.Collection('future_emails');

RocketChat.EmailSchedule = new function() {
	this.sendScheduledEmail = function(messageDetails) {
		const room = RocketChat.models.Rooms.findOneById(messageDetails.rid);

		const message = RocketChat.models.Messages.findOneById(messageDetails._id);

		if (room !== undefined && message !== undefined) {
			RocketChat.sendEmailOnMessage(message, room);
		}
		return true;
	};

	this.scheduleEmail = function(insertId, messageDetails) {
		global.SyncedCron.add({
			name: insertId,
			schedule() {
				return later.parse.recur().on(messageDetails.ts).fullDate();
			},
			job() {
				RocketChat.EmailSchedule.sendScheduledEmail(messageDetails);
				FutureEmails.remove(insertId);
				global.SyncedCron.remove(insertId);
				return insertId;
			}
		});
		return true;
	};

	this.sendOrSchedule = function(messageDetails) {
		if (messageDetails.ts < new Date()) {
			RocketChat.EmailSchedule.sendScheduledEmail(messageDetails);
		} else {
			const insertId = FutureEmails.insert(messageDetails);
			RocketChat.EmailSchedule.scheduleEmail(insertId, messageDetails);
		}
		return true;
	};
};

Meteor.startup(function() {
	FutureEmails.find().forEach(function(details) {
		if (details.ts < new Date()) {
			RocketChat.EmailSchedule.sendScheduledEmail(details);
			FutureEmails.remove(details._id);
			global.SyncedCron.remove(details._id);
		} else {
			RocketChat.EmailSchedule.scheduleEmail(details._id, details);
		}
	});

	global.SyncedCron.start();
});
