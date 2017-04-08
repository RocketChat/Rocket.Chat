Template.home.helpers
	title: ->
		return RocketChat.settings.get 'Layout_Home_Title'
	body: ->
		return RocketChat.settings.get 'Layout_Home_Body'

Template.home.onRendered ->
	width = document.body.clientWidth
	if width <= 780 # mobile devices, show room list directly
		Meteor.defer =>
			menu.open()
