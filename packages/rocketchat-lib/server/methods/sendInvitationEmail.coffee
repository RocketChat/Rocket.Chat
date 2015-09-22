Meteor.methods
	sendInvitationEmail: (emails) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] sendInvitationEmail -> Invalid user"

		unless RocketChat.authz.hasRole(Meteor.userId(), 'admin')
			throw new Meteor.Error 'not-authorized', '[methods] sendInvitationEmail -> Not authorized'

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
