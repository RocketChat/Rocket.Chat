Meteor.methods
	sendInvitationEmail: (emails) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'sendInvitationEmail' }

		unless RocketChat.authz.hasRole(Meteor.userId(), 'admin')
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'sendInvitationEmail' }

		rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
		validEmails = _.compact _.map emails, (email) -> return email if rfcMailPattern.test email

		header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || "")
		footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || "")

		if RocketChat.settings.get('Invitation_Customized')
			subject = RocketChat.settings.get('Invitation_Subject')
			html = RocketChat.settings.get('Invitation_HTML')
		else
			subject = TAPi18n.__('Invitation_Subject_Default', { lng: Meteor.user()?.language || RocketChat.settings.get('language') || 'en' })
			html = TAPi18n.__('Invitation_HTML_Default', { lng: Meteor.user()?.language || RocketChat.settings.get('language') || 'en' })

		subject = RocketChat.placeholders.replace(subject);

		for email in validEmails
			@unblock()

			html = RocketChat.placeholders.replace(html, { email: email });

			Email.send
				to: email
				from: RocketChat.settings.get 'From_Email'
				subject: subject
				html: header + html + footer

		return validEmails
