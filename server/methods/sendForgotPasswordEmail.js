import s from 'underscore.string';

Meteor.methods({
	sendForgotPasswordEmail(email) {
		check(email, String);

		email = email.trim();

		const user = RocketChat.models.Users.findOneByEmailAddress(email);

		if (user) {
			const regex = new RegExp(`^${ s.escapeRegExp(email) }$`, 'i');
			email = (user.emails || []).map((item) => item.address).find((userEmail) => regex.test(userEmail));

			if (RocketChat.settings.get('Forgot_Password_Customized')) {
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Forgot_Password_Email_Subject') || '', {
					name: user.name,
					email,
				});
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Forgot_Password_Email') || '', {
					name: s.escapeHTML(user.name),
					email: s.escapeHTML(email),
				});

				Accounts.emailTemplates.from = `${ RocketChat.settings.get('Site_Name') } <${ RocketChat.settings.get('From_Email') }>`;

				Accounts.emailTemplates.resetPassword.subject = function(/* userModel*/) {
					return subject;
				};

				Accounts.emailTemplates.resetPassword.html = function(userModel, url) {
					return html.replace(/\[Forgot_Password_Url]/g, url);
				};
			}

			try {
				Accounts.sendResetPasswordEmail(user._id, email);
			} catch (error) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
					method: 'registerUser',
					message: error.message,
				});
			}

			return true;
		}

		return false;
	},
});
