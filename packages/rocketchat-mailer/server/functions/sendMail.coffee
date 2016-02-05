Mailer.sendMail = (from, subject, body, dryrun, query) ->

	rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/
	# rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

	unless rfcMailPatternWithName.test from
		throw new Meteor.Error 'invalid-from-address', TAPi18n.__('You_informed_an_invalid_FROM_address')

	if body.indexOf('[unsubscribe]') is -1
		throw new Meteor.Error 'missing-unsubscribe-link', TAPi18n.__('You_must_provide_the_unsubscribe_link')

	userQuery = { "mailer.unsubscribed": { $exists: 0 } }
	if query
		userQuery = { $and: [ userQuery, EJSON.parse(query) ] }

	if dryrun
		Meteor.users.find({ "emails.address": from }).forEach (user) ->
		# Meteor.users.find({ "username": /\.rocket\.team/ }).forEach (user) ->
			email = user.emails?[0]?.address

			html = body.replace /\[unsubscribe\]/g, Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', { _id: user._id, createdAt: user.createdAt.getTime() }))
			html = html.replace /\[name\]/g, user.name
			fname = _.strLeft user.name, ' '
			lname = _.strRightBack user.name, ' '
			html = html.replace /\[fname\]/g, fname
			html = html.replace /\[lname\]/g, lname
			html = html.replace /\[email\]/g, email
			html = html.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2')

			email = "#{user.name} <#{email}>"

			if rfcMailPatternWithName.test email
				Meteor.defer ->
					Email.send
						to: email
						from: from
						subject: subject
						html: html

				console.log 'Sending email to ' + email

	else
		Meteor.users.find({ "mailer.unsubscribed": { $exists: 0 } }).forEach (user) ->
		# Meteor.users.find({ "username": /\.rocket\.team/ }).forEach (user) ->
			email = user.emails?[0]?.address

			html = body.replace /\[unsubscribe\]/g, Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', { _id: user._id, createdAt: user.createdAt.getTime() }))
			html = html.replace /\[name\]/g, user.name
			fname = _.strLeft user.name, ' '
			lname = _.strRightBack user.name, ' '
			html = html.replace /\[fname\]/g, fname
			html = html.replace /\[lname\]/g, lname
			html = html.replace /\[email\]/g, email
			html = html.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2')

			email = "#{user.name} <#{email}>"

			if rfcMailPatternWithName.test email
				Meteor.defer ->
					Email.send
						to: email
						from: from
						subject: subject
						html: html

				console.log 'Sending email to ' + email
