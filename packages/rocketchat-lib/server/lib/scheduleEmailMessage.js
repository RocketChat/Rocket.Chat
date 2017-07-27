import moment from 'moment';
import later from 'later';

// constains message details for which emails[updated message] are to be sent later
const FutureNotificationEmails = new Meteor.Collection('future_notification_emails');
// contains emails to be sent on desired frequency[ non-zero ]
const FutureDigestEmails = new Meteor.Collection('future_digest_emails');

RocketChat.EmailSchedule = new function() {
	this.sendNotificationEmail = function(messageDetails) {
		const room = RocketChat.models.Rooms.findOneById(messageDetails.rid);

		const message = RocketChat.models.Messages.findOneById(messageDetails._id);

		if (room !== undefined && message !== undefined) {
			RocketChat.sendEmailOnMessage(message, room);
		}
		return true;
	};

	this.scheduleNotificationEmail = function(insertId, messageDetails) {
		global.SyncedCron.add({
			name: insertId,
			schedule() {
				return later.parse.recur().on(messageDetails.ts).fullDate();
			},
			job() {
				RocketChat.EmailSchedule.sendNotificationEmail(messageDetails);
				FutureNotificationEmails.remove(insertId);
				global.SyncedCron.remove(insertId);
				return insertId;
			}
		});
		return true;
	};

	this.sendOrScheduleNotification = function(messageDetails) {
		if (messageDetails.ts < new Date()) {
			RocketChat.EmailSchedule.sendNotificationEmail(messageDetails);
		} else {
			const insertId = FutureNotificationEmails.insert(messageDetails);
			RocketChat.EmailSchedule.scheduleNotificationEmail(insertId, messageDetails);
		}
		return true;
	};

	this.sendDigestEmail = function(email) {
		if (email !== undefined) {
			delete email.ts;
			delete email._id;
			Meteor.defer(() => {
				Email.send(email);
			});
		}
		return true;
	};

	this.scheduleDigestEmail = function(insertId, email) {
		global.SyncedCron.add({
			name: insertId,
			schedule() {
				return later.parse.recur().on(email.ts).fullDate();
			},
			job() {
				RocketChat.EmailSchedule.sendDigestEmail(email);
				FutureDigestEmails.remove(insertId);
				global.SyncedCron.remove(insertId);
				return insertId;
			}
		});
		return true;
	};

	this.sendOrScheduleDigest = function(email) {
		if (email.ts < new Date()) {
			RocketChat.EmailSchedule.sendDigestEmail(email);
		} else {
			const insertId = FutureDigestEmails.insert(email);
			RocketChat.EmailSchedule.scheduleDigestEmail(insertId, email);
		}
		return true;
	};

	this.getDigestTiming = function(partitions) {
		return moment(new Date()).startOf('day').add((Math.floor(moment(new Date()).hours()/partitions)+1)*partitions, 'hours').toDate();
	};
};

Meteor.startup(function() {
	FutureNotificationEmails.find().forEach(function(details) {
		if (details.ts < new Date()) {
			RocketChat.EmailSchedule.sendNotificationEmail(details);
			FutureNotificationEmails.remove(details._id);
			global.SyncedCron.remove(details._id);
		} else {
			RocketChat.EmailSchedule.scheduleNotificationEmail(details._id, details);
		}
	});

	FutureDigestEmails.find().forEach(function(email) {
		if (email.ts < new Date()) {
			RocketChat.EmailSchedule.sendDigestEmail(email);
			FutureDigestEmails.remove(email._id);
			global.SyncedCron.remove(email._id);
		} else {
			RocketChat.EmailSchedule.scheduleDigestEmail(email._id, email);
		}
	});

	global.SyncedCron.start();
});
