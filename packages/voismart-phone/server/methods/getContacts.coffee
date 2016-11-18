Meteor.methods
	getContacts: (value) ->
		domain = RocketChat.settings.get('OrchestraIntegration_Domain')
		user = RocketChat.models.Users.findOneById Meteor.userId()
		username = user.username + "@" + domain
		ng = new NGApiAuto(username, RocketChat.settings.get('OrchestraIntegration_Server'))

		try
			filter = '(sn=*{SRC}* or givenName=*{SRC}* or o=*{SRC}* or mail=*{SRC}* or mobile=*{SRC}* or facsimileTelephoneNumber=*{SRC}* or telephoneNumber=*{SRC}*)'
			new_filter = filter.replace(/{SRC}/g, value)
			results = ng.getContacts(new_filter)
		catch e
			return

		if results then contacts: results.data else contacts: []
