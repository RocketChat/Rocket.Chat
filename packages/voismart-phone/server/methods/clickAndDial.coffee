Meteor.methods
	clickAndDial: (number) ->
		this.unblock()
		domain = RocketChat.settings.get('OrchestraIntegration_Domain')
		user = RocketChat.models.Users.findOneById Meteor.userId()
		username = user.username + "@" + domain
		ng = new NGApiAuto(username, RocketChat.settings.get('OrchestraIntegration_Server'))

		number = number.trim()
		ng.clickAndDial(number)
