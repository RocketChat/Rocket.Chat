Meteor.methods({
	sendForgotPasswordEmail(email) {
		check(email, String);

		email = email.trim();

		const user = RocketChat.models.Users.findOneByEmailAddress(email);

		if (user) {
			const regex = new RegExp(`^${ s.escapeRegExp(email) }$`, 'i');
			email = (user.emails || []).map(item => item.address).find(userEmail => regex.test(userEmail));

			if (RocketChat.settings.get('Forgot_Password_Customized')) {
				const data = { name: user.name, email };
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Forgot_Password_Email_Subject') || '', data);
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Forgot_Password_Email') || '', data);

				Accounts.emailTemplates.resetPassword.subject = function(/*userModel*/) {
					return subject;
				};

				Accounts.emailTemplates.resetPassword.html = function(userModel, url) {
					url = url.replace('/#/', '/');
					return html.replace(/\[Forgot_Password_Url]/g, url);
				};
			}

			try {
				Accounts.sendResetPasswordEmail(user._id, email);
			} catch (error) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
					method: 'registerUser',
					message: error.message
				});
			}

			return true;
		}

		return false;
	}
});
