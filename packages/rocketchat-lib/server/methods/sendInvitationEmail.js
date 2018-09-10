import s from 'underscore.string';
import { send as sendEmail, checkEmail, replace, inlinecss } from 'meteor/rocketchat:mailer';
let body = '';
Meteor.startup(() => {
	setTimeout(() => {

		RocketChat.settings.get('Invitation_HTML', (key, value) => {
			body = inlinecss(value);
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
		const validEmails = emails.filter(checkEmail);

		const subject = replace(RocketChat.settings.get('Invitation_Subject'));

		validEmails.forEach((email) => {
			const html = replace(body, {
				email: s.escapeHTML(email),
			});
			try {
				sendEmail({
					to: email,
					from: RocketChat.settings.get('From_Email'),
					subject,
					html,
				});
			} catch ({ message }) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ message }`, {
					method: 'sendInvitationEmail',
					message,
				});
			}
		});
		return validEmails;
	},
});
