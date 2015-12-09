Template.loginHeader.helpers
	header: ->
		RocketChat.settings.get 'Layout_Login_Header' #get from rocketchat-lib/server/startup/settings.coffee#
