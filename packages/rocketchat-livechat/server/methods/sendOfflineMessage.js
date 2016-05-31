/* globals DDPRateLimiter */
Meteor.methods({
	'livechat:sendOfflineMessage'(data) {
		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

		const message = (data.message + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

		const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${data.name}</p>
			<p><strong>Visitor email:</strong> ${data.email}</p>
			<p><strong>Message:</strong><br>${message}</p>`;

		let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = RocketChat.settings.get('From_Email');
		}

		Meteor.defer(() => {
			Email.send({
				to: RocketChat.settings.get('Livechat_offline_email'),
				from: `${data.name} - ${data.email} <${fromEmail}>`,
				replyTo: `${data.name} <${data.email}>`,
				subject: `Livechat offline message from ${data.name}: ${(data.message + '').substring(0, 20)}`,
				html: header + html + footer
			});
		});

		return true;
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'livechat:sendOfflineMessage',
	connectionId() {
		return true;
	}
}, 1, 5000);
