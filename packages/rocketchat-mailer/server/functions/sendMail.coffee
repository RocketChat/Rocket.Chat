Mailer.sendMail = (from, subject, body, dryrun, query) ->

	rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/
	# rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

	unless rfcMailPatternWithName.test from
		throw new Meteor.Error 'error-invalid-from-address', 'Invalid from address', { function: 'Mailer.sendMail' }

	if body.indexOf('[unsubscribe]') is -1
		throw new Meteor.Error 'error-missing-unsubscribe-link', 'You must provide the [unsubscribe] link.', { function: 'Mailer.sendMail' }

	header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

	userQuery = { "mailer.unsubscribed": { $exists: 0 } }
	if query
		userQuery = { $and: [ userQuery, EJSON.parse(query) ] }

	if dryrun
		Meteor.users.find({ "emails.address": from }).forEach (user) ->
		# Meteor.users.find({ "username": /\.rocket\.team/ }).forEach (user) ->
			email = user.emails?[0]?.address

			html = RocketChat.placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', { _id: user._id, createdAt: user.createdAt.getTime() })),
				name: user.name,
				email: email
			});

			email = "#{user.name} <#{email}>"

			if rfcMailPatternWithName.test email
				Meteor.defer ->
					Email.send
						to: email
						from: from
						subject: subject
						html: header + html + footer

				console.log 'Sending email to ' + email

	else
		Meteor.users.find({ "mailer.unsubscribed": { $exists: 0 } }).forEach (user) ->
		# Meteor.users.find({ "username": /\.rocket\.team/ }).forEach (user) ->
			email = user.emails?[0]?.address

			html = RocketChat.placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', { _id: user._id, createdAt: user.createdAt.getTime() })),
				name: user.name,
				email: email
			});

			email = "#{user.name} <#{email}>"

			if rfcMailPatternWithName.test email
				Meteor.defer ->
					Email.send
						to: email
						from: from
						subject: subject
						html: header + html + footer

				console.log 'Sending email to ' + email
