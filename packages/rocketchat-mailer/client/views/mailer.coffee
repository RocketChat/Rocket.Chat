Template.mailer.helpers
	fromEmail: ->
		return RocketChat.settings.get 'From_Email'

Template.mailer.events
	'click .send': (e, t) ->
		e.preventDefault()
		from = $(t.find('[name=from]')).val()
		subject = $(t.find('[name=subject]')).val()
		body = $(t.find('[name=body]')).val()
		dryrun = $(t.find('[name=dryrun]:checked')).val()
		query = $(t.find('[name=query]')).val()

		unless from
			toastr.error TAPi18n.__('From_email_is_required')
			return

		if body.indexOf('[unsubscribe]') is -1
			toastr.error TAPi18n.__('You_must_provide_the_unsubscribe_link')
			return

		Meteor.call 'Mailer.sendMail', from, subject, body, dryrun, query, (err) ->
			return toastr.error err.reason if err
			toastr.success TAPi18n.__('The_emails_are_being_sent')
