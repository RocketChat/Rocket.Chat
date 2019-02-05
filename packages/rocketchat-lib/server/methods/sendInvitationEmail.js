import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import * as Mailer from 'meteor/rocketchat:mailer';

let html = '';
Meteor.startup(() => {
	Mailer.getTemplate('Invitation_Email', (value) => {
		html = value;
	});
});

/* eslint no-unused-vars: ["error", { "args": "none" }] */
Meteor.methods({
	sendInvitationEmail(emails, language) {
		check(emails, [String]);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendInvitationEmail',
			});
		}
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'bulk-register-user')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'sendInvitationEmail',
			});
		}
		const validEmails = emails.filter(Mailer.checkAddressFormat);

		const subject = RocketChat.settings.get('Invitation_Subject');

		return validEmails.filter((email) => {
			try {
				return Mailer.send({
					to: email,
					from: RocketChat.settings.get('From_Email'),
					subject,
					html,
					data: {
						email,
						Invite_Link:Meteor.runAsUser(Meteor.userId(), () => Meteor.call('getInviteLink')),
						Username:Meteor.user().username,
						Avatar_Link:`${ RocketChat.settings.get('Site_Url').slice(0, -1) }${ getAvatarUrlFromUsername(Meteor.user().username) }`,
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
