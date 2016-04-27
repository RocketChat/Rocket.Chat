Meteor.methods
	sendSMTPTestEmail: ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'sendSMTPTestEmail' }

		user = Meteor.user()
		unless user.emails?[0]?.address
			throw new Meteor.Error 'error-invalid-email', "Invalid email", { method: 'sendSMTPTestEmail' }

		this.unblock()

		Email.send
			to: user.emails[0].address
			from: RocketChat.settings.get('From_Email')
			subject: "SMTP Test Email"
			html: "You have successfully sent an email"

		console.log 'Sending email to ' + user.emails[0].address

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
