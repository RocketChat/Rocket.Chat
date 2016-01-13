Meteor.methods
	'mailMessages': (data) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] mailMessages -> Invalid user")

		check(data, Match.ObjectIncluding({ rid: String, to_users: [ String ], to_emails: String, subject: String, messages: [ String ], language: String }))

		room = Meteor.call 'canAccessRoom', data.rid, Meteor.userId()
		unless room
			throw new Meteor.Error('invalid-room', "[methods] mailMessages -> Invalid room")

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'mail-messages')
			throw new Meteor.Error 'not-authorized'

		rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/

		emails = _.compact(data.to_emails.trim().split(','))
		missing = []
		if data.to_users.length > 0
			for username in data.to_users
				user = RocketChat.models.Users.findOneByUsername(username)
				if user?.emails?[0]?.address
					emails.push user.emails[0].address
				else
					missing.push username
		console.log emails
		for email in emails
			unless rfcMailPatternWithName.test email.trim()
				throw new Meteor.Error('invalid-email', "[methods] mailMessages -> Invalid e-mail #{email}")

		user = Meteor.user()
		name = user.name
		email = user.emails?[0]?.address

		data.language = data.language.split('-').shift().toLowerCase()

		if data.language isnt 'en'
			localeFn = Meteor.call 'loadLocale', data.language
			if localeFn
				Function(localeFn)()

		html = ""
		RocketChat.models.Messages.findByRoomIdAndMessageIds(data.rid, data.messages, { sort: { ts: 1 } }).forEach (message) ->
			dateTime = moment(message.ts).locale(data.language).format('L LT')
			html += "<p style='margin-bottom: 5px'><b>#{message.u.username}</b> <span style='color: #aaa; font-size: 12px'>#{dateTime}</span><br />" + RocketChat.Message.parse(message, data.language) + "</p>"

		Meteor.defer ->
			Email.send
				to: emails
				from: RocketChat.settings.get('From_Email')
				replyTo: email
				subject: data.subject
				html: html

			console.log 'Sending email to ' + emails.join(', ')

		return { success: true, missing: missing }
