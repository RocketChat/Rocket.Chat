import later from 'later';

parser = later.parse;

const FutureEmails = new Meteor.Collection('future_emails');

RocketChat.sendScheduledEmail = function(messageDetails) {
	const room = RocketChat.models.Rooms.findOneById(messageDetails.rid);

	const message = RocketChat.models.Messages.findOneById(messageDetails.mid);

	if (room !== undefined && message !== undefined) {
		RocketChat.sendEmailOnMessage(message, room);
	}
};

RocketChat.scheduleEmail = function(insertId, messageDetails) {
	SyncedCron.add({
		name: insertId,
		schedule(parser) {
			return parser.recur().on(messageDetails.ts).fullDate();
		},
		job() {
			RocketChat.sendScheduledEmail(messageDetails);
			FutureEmails.remove(insertId);
			SyncedCron.remove(insertId);
			return insertId;
		}
	});
};

RocketChat.checkSchedule = function(messageDetails) {
	if (messageDetails.ts < new Date()) {
		RocketChat.sendScheduledEmail(messageDetails);
	} else {
		const insertId = FutureEmails.insert(messageDetails);
		RocketChat.scheduleEmail(insertId, messageDetails);
	}
};

Meteor.startup(function() {
	FutureEmails.find().forEach(function(details) {
		if (details.ts < new Date()) {
			RocketChat.sendScheduledEmail(details);
			FutureEmails.remove(details._id);
			SyncedCron.remove(details._id);
		} else {
			RocketChat.scheduleEmail(details._id, details);
		}
	});

	SyncedCron.start();
});
