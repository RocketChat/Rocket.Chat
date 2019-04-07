import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import * as Mailer from '../../app/mailer';
import { Users } from '../../app/models';
import { settings } from '../../app/settings';

let subject = '';
let html = '';

Meteor.startup(() => {
	settings.get('Verification_Email_Subject', function(key, value) {
		subject = Mailer.replace(value || '');
	});

	Mailer.getTemplateWrapped('Verification_Email', function(value) {
		html = value;
	});
});

Meteor.methods({
	sendConfirmationEmail(to) {
		check(to, String);
		const email = to.trim();

		const user = Users.findOneByEmailAddress(email);

		if (!user) {
			return false;
		}

		Accounts.emailTemplates.verifyEmail.subject = function(/* userModel*/) {
			return subject;
		};

		Accounts.emailTemplates.verifyEmail.html = function(userModel, url) {
			return Mailer.replace(html, { Verification_Url:url, name: user.name });
		};

		try {
			return Accounts.sendVerificationEmail(user._id, email);
		} catch (error) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
				method: 'registerUser',
				message: error.message,
			});
		}

	},
});
