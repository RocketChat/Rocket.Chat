Meteor.methods
	'mailMessages': (data) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] mailMessages -> Invalid user")

		check(data, Match.ObjectIncluding({ rid: String, to: String, subject: String, messages: [ String ], language: String }))

		room = Meteor.call 'canAccessRoom', data.rid, Meteor.userId()
		unless room
			throw new Meteor.Error('invalid-room', "[methods] mailMessages -> Invalid room")

		rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/
		emails = data.to.trim().split(',')
		for email in emails
			unless rfcMailPatternWithName.test email.trim()
				throw new Meteor.Error('invalid-email', "[methods] mailMessages -> Invalid e-mail")

		user = Meteor.user()
		name = user.name
		email = user.emails?[0]?.address

		if data.language isnt 'en'
			localeFn = Meteor.call 'loadLocale', data.language
			if localeFn
				Function(localeFn)()
				moment.locale(data.language)

		html = ""
		RocketChat.models.Messages.findByRoomIdAndMessageIds(data.rid, data.messages, { sort: { ts: 1 } }).forEach (message) ->
			dateTime = moment(message.ts).format('L LT')
			html += "<p style='margin-bottom: 5px'><b>#{message.u.username}</b> <span style='color: #aaa; font-size: 12px'>#{dateTime}</span><br />" + RocketChat.Message.parse(message, data.language) + "</p>"

		Meteor.defer ->
			Email.send
				to: emails
				from: RocketChat.settings.get('From_Email')
				replyTo: email
				subject: data.subject
				html: html

			console.log 'Sending email to ' + emails.join(', ')


		return true
