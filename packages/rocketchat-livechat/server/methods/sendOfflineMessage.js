/* globals DDPRateLimiter */
const dns = Npm.require('dns');

Meteor.methods({
	'livechat:sendOfflineMessage'(data) {
		check(data, {
			name: String,
			email: String,
			message: String
		});

		if (!RocketChat.settings.get('Livechat_display_offline_form')) {
			return false;
		}

		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

		const message = (`${ data.message }`).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

		const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${ data.name }</p>
			<p><strong>Visitor email:</strong> ${ data.email }</p>
			<p><strong>Message:</strong><br>${ message }</p>`;

		let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = RocketChat.settings.get('From_Email');
		}

		if (RocketChat.settings.get('Livechat_validate_offline_email')) {
			const emailDomain = data.email.substr(data.email.lastIndexOf('@') + 1);

			try {
				Meteor.wrapAsync(dns.resolveMx)(emailDomain);
			} catch (e) {
				throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', { method: 'livechat:sendOfflineMessage' });
			}
		}

		Meteor.defer(() => {
			Email.send({
				to: RocketChat.settings.get('Livechat_offline_email'),
				from: `${ data.name } - ${ data.email } <${ fromEmail }>`,
				replyTo: `${ data.name } <${ data.email }>`,
				subject: `Livechat offline message from ${ data.name }: ${ (`${ data.message }`).substring(0, 20) }`,
				html: header + html + footer
			});
		});

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.offlineMessage', data);
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
