import moment from 'moment';
import later from 'later';

parser = later.parse;

FutureEmails = new Meteor.Collection('future_emails');

RocketChat.sendScheduledEmail = function(messageDetails) {
	console.log('sending scheduled email');
	console.log(messageDetails);
	console.log(new Date());
  var room = RocketChat.models.Rooms.findOneById(messageDetails.rid);
  console.log(room);
  console.log(RocketChat.models.Messages.findOneById(messageDetails.mid));
  console.log("now sending");
	RocketChat.sendEmailOnMessage(RocketChat.models.Messages.findOneById(messageDetails.mid), room);
}

RocketChat.scheduleEmail = function(insertId, messageDetails) {
	SyncedCron.add({
		name: insertId,
		schedule: function(parser) {
			return parser.recur().on(messageDetails.ts).fullDate();
		},
		job: function() {
			RocketChat.sendScheduledEmail(messageDetails);
			FutureEmails.remove(insertId);
			SyncedCron.remove(insertId);
			return insertId;
		}
	});
}

RocketChat.checkSchedule = function(messageDetails) {
	if (messageDetails.ts < new Date()) {
		RocketChat.sendScheduledEmail(messageDetails);
	} else {
		var insertId = FutureEmails.insert(messageDetails);
		RocketChat.scheduleEmail(insertId, messageDetails);
	}
	return true;
}

Meteor.startup(function() {
	FutureEmails.find().forEach(function(details) {
		if (details.ts < new Date()) {
			console.log("sending pending email");
			console.log(details);
			RocketChat.sendScheduledEmail(details);
			FutureEmails.remove(details._id);
			SyncedCron.remove(details._id);
		} else {
			RocketChat.scheduleEmail(details._id, details);
		}
	});

	SyncedCron.start();

	console.log('*******************************************************');
});
