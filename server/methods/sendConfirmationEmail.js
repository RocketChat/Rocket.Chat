Meteor.methods({
	sendConfirmationEmail(email, shouldSendVerificationEmail = true) {
		check(email, String);
		email = email.trim();

		const user = RocketChat.models.Users.findOneByEmailAddress(email);

		if (user && shouldSendVerificationEmail) {
			if (RocketChat.settings.get('Verification_Customized')) {
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');

				Accounts.emailTemplates.verifyEmail.subject = function(/*userModel*/) {
					return subject;
				};

				Accounts.emailTemplates.verifyEmail.html = function(userModel, url) {
					return html.replace(/\[Verification_Url]/g, url);
				};
			}

			try {
				Accounts.sendVerificationEmail(user._id, email);
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
