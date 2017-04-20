Meteor.methods({
	sendSMTPTestEmail() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendSMTPTestEmail'
			});
		}
		const user = Meteor.user();
		if (!user.emails && !user.emails[0] && user.emails[0].address) {
			throw new Meteor.Error('error-invalid-email', 'Invalid email', {
				method: 'sendSMTPTestEmail'
			});
		}
		this.unblock();
		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
		console.log(`Sending test email to ${ user.emails[0].address }`);
		try {
			Email.send({
				to: user.emails[0].address,
				from: RocketChat.settings.get('From_Email'),
				subject: 'SMTP Test Email',
				html: `${ header }<p>You have successfully sent an email</p>${ footer }`
			});
		} catch ({message}) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ message }`, {
				method: 'sendSMTPTestEmail',
				message
			});
		}
		return {
			message: 'Your_mail_was_sent_to_s',
			params: [user.emails[0].address]
		};
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'sendSMTPTestEmail',
	userId() {
		return true;
	}
}, 1, 1000);
