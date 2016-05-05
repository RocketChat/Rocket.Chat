Meteor.methods({
	'livechat:sendOfflineMessage'(data) {
		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

		const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${data.name}</p>
			<p><strong>Visitor email:</strong> ${data.email}</p>
			<p><strong>Message:</strong> ${data.message}</p>`;

		Meteor.defer(() => {
			Email.send({
				to: RocketChat.settings.get('Livechat_offline_email'),
				from: RocketChat.settings.get('From_Email'),
				subject: 'New livechat offline message',
				html: header + html + footer
			});
		});

		return true;
	}
});
