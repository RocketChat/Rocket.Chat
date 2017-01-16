Meteor.methods
	sendConfirmationEmail: (email) ->

		check email, String

		user = RocketChat.models.Users.findOneByEmailAddress s.trim(email)

		if user?
			if RocketChat.settings.get('Verification_Customized')
				subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '')
				html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '')
				Accounts.emailTemplates.verifyEmail.subject = (userModel) ->
					return subject
				Accounts.emailTemplates.verifyEmail.html = (userModel, url) ->
					return html.replace(/\[Verification_Url]/g, url);

			try
				Accounts.sendVerificationEmail(user._id, s.trim(email))
			catch error
				throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }

			return true
		return false
