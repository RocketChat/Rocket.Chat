/* globals emailSettings, DDPRateLimiter */
/* Send a transcript of the room converstation to the given email */
Meteor.methods({
	'livechat:sendTranscript'(rid, email) {
		check(rid, String);
		check(email, String);

		var messages = RocketChat.models.Messages.find({'rid': rid}, { sort: { 'ts' : 1 }}).fetch();
		var header = '';
		var footer = '';

		if (messages[0].ts.getTime() > messages[1].ts.getTime()) {
			messages.reverse();
		}

		var html = '<div> <hr>';
		for (var i = 0; i < messages.length; i++) {
			var message = messages[i];

			// Agents should use their username, but livechat guests should user their name.
			var key;
			if (message.u.type === 'user') {
				key = 'username';
			} else {
				key = 'name';
			}

			var author = (message.u)[key];
			var datetime = moment(message.ts).format('dddd, MMMM Do YYYY, h:mm:ss a');
			var singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
			html = html + singleMessage;
		}

		html = html + '</div>';

		let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = RocketChat.settings.get('From_Email');
		}

		emailSettings = {
			to: email,
			from: fromEmail,
			replyTo: fromEmail,
			subject: 'Transcript of your livechat conversation.',
			html: header + html + footer
		};

		console.log('Sending transcript email to ' + emailSettings.to);

		Meteor.defer(() => {
			Email.send(emailSettings);
		});

		Meteor.defer(() => {
			RocketChat.callbacks.run('sendTranscript', messages, email);
		});

		return true;
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'livechat:sendTranscript',
	connectionId() {
		return true;
	}
}, 1, 5000);