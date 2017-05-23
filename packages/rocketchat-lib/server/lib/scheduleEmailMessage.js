import later from 'later';

parser = later.parse;

const FutureEmails = new Meteor.Collection('future_emails');

class EmailSchedule {
	sendScheduledEmail(messageDetails) {
		const room = RocketChat.models.Rooms.findOneById(messageDetails.rid);

		const message = RocketChat.models.Messages.findOneById(messageDetails._id);

		if (room !== undefined && message !== undefined) {
			RocketChat.sendEmailOnMessage(message, room);
		}
		return true;
	}

	scheduleEmail(insertId, messageDetails) {
		SyncedCron.add({
			name: insertId,
			schedule(parser) {
				return parser.recur().on(messageDetails.ts).fullDate();
			},
			job() {
				RocketChat.EmailSchedule.sendScheduledEmail(messageDetails);
				FutureEmails.remove(insertId);
				SyncedCron.remove(insertId);
				return insertId;
			}
		});
		return true;
	}

	sendOrSchedule(messageDetails) {
		if (messageDetails.ts < new Date()) {
			RocketChat.EmailSchedule.sendScheduledEmail(messageDetails);
		} else {
			const insertId = FutureEmails.insert(messageDetails);
			RocketChat.EmailSchedule.scheduleEmail(insertId, messageDetails);
		}
		return true;
	}
}

RocketChat.EmailSchedule = new EmailSchedule();

Meteor.startup(function() {
	FutureEmails.find().forEach(function(details) {
		if (details.ts < new Date()) {
			RocketChat.EmailSchedule.sendScheduledEmail(details);
			FutureEmails.remove(details._id);
			SyncedCron.remove(details._id);
		} else {
			RocketChat.EmailSchedule.scheduleEmail(details._id, details);
		}
	});

	SyncedCron.start();
});
