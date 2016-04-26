Meteor.methods
	sendInvitationEmail: (emails) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'sendInvitationEmail' }

		unless RocketChat.authz.hasRole(Meteor.userId(), 'admin')
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'sendInvitationEmail' }

		rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
		validEmails = _.compact _.map emails, (email) -> return email if rfcMailPattern.test email

		for email in validEmails
			@unblock()

			Email.send
				to: email
				from: RocketChat.settings.get 'From_Email'
				subject: RocketChat.settings.get 'Invitation_Subject'
				html: RocketChat.settings.get 'Invitation_HTML'


		return validEmails
