RocketChat.actionLinks.register 'phoneDoCall', (message, params) ->
	console.log("will do a call")
	console.log("msg -> ", message)
	console.log("params -> ", params)
	RocketChat.TabBar.setTemplate "phone", ->
		RocketChat.Phone.newCall(params)


