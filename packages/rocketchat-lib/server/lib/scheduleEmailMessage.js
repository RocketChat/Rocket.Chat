import later from 'later';

parser = later.parse;

const FutureEmails = new Meteor.Collection('future_emails');

class EmailSchedule {
	sendScheduledEmail(messageDetails) {
		const room = RocketChat.models.Rooms.findOneById(messageDetails.rid);

		const message = RocketChat.models.Messages.findOneById(messageDetails.mid);

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
				this.sendScheduledEmail(messageDetails);
				FutureEmails.remove(insertId);
				SyncedCron.remove(insertId);
				return insertId;
			}
		});
		return true;
	}

	sendOrSchedule(messageDetails) {
		if (messageDetails.ts < new Date()) {
			this.sendScheduledEmail(messageDetails);
		} else {
			const insertId = FutureEmails.insert(messageDetails);
			this.scheduleEmail(insertId, messageDetails);
		}
		return true;
	}
}

RocketChat.EmailSchedule = EmailSchedule;

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
