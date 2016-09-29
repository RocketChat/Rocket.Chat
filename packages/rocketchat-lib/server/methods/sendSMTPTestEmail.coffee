Meteor.methods
	sendSMTPTestEmail: ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'sendSMTPTestEmail' }

		user = Meteor.user()
		unless user.emails?[0]?.address
			throw new Meteor.Error 'error-invalid-email', "Invalid email", { method: 'sendSMTPTestEmail' }

		this.unblock()

		header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

		console.log 'Sending test email to ' + user.emails[0].address

		try
			Email.send
				to: user.emails[0].address
				from: RocketChat.settings.get('From_Email')
				subject: "SMTP Test Email"
				html: header + "<p>You have successfully sent an email</p>" + footer
		catch error
			throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'sendSMTPTestEmail', message: error.message }

		return {
			message: "Your_mail_was_sent_to_s"
			params: [user.emails[0].address]
		}

# Limit a user to sending 1 test mail/second
DDPRateLimiter.addRule
	type: 'method'
	name: 'sendSMTPTestEmail'
	userId: (userId) ->
		return true
, 1, 1000
