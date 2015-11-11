Template.rocketMailer.events
	'click .send': (e, t) ->
		e.preventDefault()
		from = $(t.find('[name=from]')).val()
		subject = $(t.find('[name=subject]')).val()
		body = $(t.find('[name=body]')).val()

		if body.indexOf('[unsubscribe]') is -1
			toastr.error TAPi18n.__('You_must_provide_the_unsubscribe_link')
		else
			Meteor.call 'RocketMailer.sendMail', from, subject, body, (err) ->
				return toastr.error err.reason if err
				toastr.success TAPi18n.__('The_emails_are_being_sent')
