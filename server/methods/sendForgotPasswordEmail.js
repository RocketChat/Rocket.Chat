import s from 'underscore.string';
import { getHeader, getFooter, replace, inlinecss, replacekey } from 'meteor/rocketchat:mailer';

let template = '';

Meteor.startup(() => {
	RocketChat.settings.get('Forgot_Password_Email', (key, value) => {
		template = inlinecss(getHeader() + (value || '') + getFooter());
	});
});

Meteor.methods({
	sendForgotPasswordEmail(to) {
		check(to, String);

		let email = to.trim();

		const user = RocketChat.models.Users.findOneByEmailAddress(email);

		if (!user) {
			return false;
		}

		const regex = new RegExp(`^${ s.escapeRegExp(email) }$`, 'i');
		email = (user.emails || []).map((item) => item.address).find((userEmail) => regex.test(userEmail));

		const subject = replace(RocketChat.settings.get('Forgot_Password_Email_Subject') || '', {
			name: user.name,
			email,
		});

		const html = replace(template, {
			name: s.escapeHTML(user.name),
			email: s.escapeHTML(email),
		});

		Accounts.emailTemplates.from = `${ RocketChat.settings.get('Site_Name') } <${ RocketChat.settings.get('From_Email') }>`;

		try {

			Accounts.emailTemplates.resetPassword.subject = function(/* userModel*/) {
				return subject; // TODO check a better way to do this
			};

			Accounts.emailTemplates.resetPassword.html = function(userModel, url) {
				return replacekey(html, 'Forgot_Password_Url', url);
			};
			return Accounts.sendResetPasswordEmail(user._id, email);
		} catch (error) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
				method: 'registerUser',
				message: error.message,
			});
		}
	},
});
