RocketChat.actionLinks.register 'phoneDoCall', (message, params) ->
	console.log("will do a call")
	console.log("msg -> ", message)
	console.log("params -> ", params)

	if params.number
		RocketChat.TabBar.setTemplate "phone", ->
			RocketChat.Phone.newCall(params)

	if params.url
		window.open params.url, "_blank"


