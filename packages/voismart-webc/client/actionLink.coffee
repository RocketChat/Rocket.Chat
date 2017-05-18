RocketChat.actionLinks.register 'webcAudioConf', (message, params) ->
	console.log("will do a call")
	console.log("msg -> ", message)
	console.log("params -> ", params)

	if params.number
		enabled = RocketChat.settings.get('Phone_Enabled')
		if enabled and !Meteor.isCordova
			tabBar =  Template.instance().tabBar
			tabBar.setTemplate "phone"
			tabBar.open()
			RocketChat.Phone.newCall(params.number, true)

	if params.url and Meteor.isCordova
		window.open params.url, "_blank"
