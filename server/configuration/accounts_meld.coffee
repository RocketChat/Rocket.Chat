orig_updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService
Accounts.updateOrCreateUserFromExternalService = (serviceName, serviceData, options) ->
	if serviceName not in ['facebook', 'github', 'google', 'meteor-developer', 'linkedin', 'twitter'] and serviceData._oAuthCustom isnt true
		return

	if serviceName is 'meteor-developer'
		if _.isArray serviceData?.emails
			serviceData.emails.sort (a, b) ->
				return a.primary isnt true

			for email in serviceData.emails
				if email.verified is true
					serviceData.email = email.address
					break

	if serviceName is 'linkedin'
		serviceData.email = serviceData.emailAddress

	if serviceData.email

		# Remove not verified users that have same email
		notVerifiedUser = Meteor.users.remove({emails: {$elemMatch: {address: serviceData.email, verified: false}}})

		# Try to get existent user with same email verified
		user = RocketChat.models.Users.findOneByVerifiedEmailAddress(serviceData.email, true)

		if user?
			RocketChat.models.Users.setServiceId user._id, serviceName, serviceData.id

	return orig_updateOrCreateUserFromExternalService.apply(this, arguments)
