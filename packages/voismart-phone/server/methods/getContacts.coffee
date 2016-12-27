Meteor.methods
	getContacts: (value) ->
		domain = RocketChat.settings.get('OrchestraIntegration_Domain')
		user = RocketChat.models.Users.findOneById Meteor.userId()
		username = user.username + "@" + domain
		ng = new NGApiAuto(username, RocketChat.settings.get('OrchestraIntegration_Server'))

		try
			value = value.trim()
			splitted_values = value.split(" +")
			filter = '(sn=*{SRC}* or givenName=*{SRC}* or o=*{SRC}* or mail=*{SRC}* or mobile=*{SRC}* or facsimileTelephoneNumber=*{SRC}* or telephoneNumber=*{SRC}*)'
			new_filter = (filter.replace(/{SRC}/g,	v) for v in splitted_values)
			joined_filter = new_filter.join(" and ")
			results = ng.getContacts(joined_filter)
		catch e
			return

		if results then contacts: results.data else contacts: []
