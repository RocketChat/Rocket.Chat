import * as Mailer from 'meteor/rocketchat:mailer';
let html = '';
Meteor.startup(() => {
	setTimeout(() => {
		Mailer.getTemplate('Invitation_HTML', (value) => {
			html = value;
		});
	}, 1000);
});

Meteor.methods({
	sendInvitationEmail(emails) {
		check(emails, [String]);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendInvitationEmail',
			});
		}
		if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'sendInvitationEmail',
			});
		}
		const validEmails = emails.filter(Mailer.checkAddressFormat);

		const subject = RocketChat.settings.get('Invitation_Subject');

		return validEmails.filter((email) => {
			try {
				Mailer.send({
					to: email,
					from: RocketChat.settings.get('From_Email'),
					subject,
					html,
					data: {
						email,
					},
				});
			} catch ({ message }) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ message }`, {
					method: 'sendInvitationEmail',
					message,
				});
			}
		});
	},
});
