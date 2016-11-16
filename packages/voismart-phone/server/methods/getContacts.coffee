Meteor.methods
	getContacts: (value) ->
		ng = new NGApi(RocketChat.settings.get('OrchestraIntegration_Server'))
		domain = RocketChat.settings.get('OrchestraIntegration_Domain')
		user = RocketChat.models.Users.findOneById Meteor.userId()
		username = user.username + "@" + domain
		try
			res = ng.trustedLogin username
			token = res.token
		catch e
			# unauthorized or error contacting server
			return

		try
			filter = '(sn=*{SRC}* or givenName=*{SRC}* or o=*{SRC}* or mail=*{SRC}* or mobile=*{SRC}* or facsimileTelephoneNumber=*{SRC}* or telephoneNumber=*{SRC}*)'
			new_filter = filter.replace(/{SRC}/g, value)
			results = ng.getContacts(token, new_filter)
		catch e
			return

		if results then contacts: results.data else contacts: []
