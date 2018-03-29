import _ from 'underscore';

Meteor.methods({
	sendInvitationEmail(emails) {
		check(emails, [String]);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendInvitationEmail'
			});
		}
		if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'sendInvitationEmail'
			});
		}
		const rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
		const validEmails = _.compact(_.map(emails, function(email) {
			if (rfcMailPattern.test(email)) {
				return email;
			}
		}));
		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
		let html;
		let subject;
		const user = Meteor.user();
		const lng = user.language || RocketChat.settings.get('language') || 'en';
		if (RocketChat.settings.get('Invitation_Customized')) {
			subject = RocketChat.settings.get('Invitation_Subject');
			html = RocketChat.settings.get('Invitation_HTML');
		} else {
			subject = TAPi18n.__('Invitation_Subject_Default', {
				lng
			});
			html = TAPi18n.__('Invitation_HTML_Default', {
				lng
			});
		}
		subject = RocketChat.placeholders.replace(subject);
		validEmails.forEach(email => {
			this.unblock();
			html = RocketChat.placeholders.replace(html, {
				email
			});
			try {
				Email.send({
					to: email,
					from: RocketChat.settings.get('From_Email'),
					subject,
					html: header + html + footer
				});
			} catch ({message}) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ message }`, {
					method: 'sendInvitationEmail',
					message
				});
			}
		});
		return validEmails;
	}
});
