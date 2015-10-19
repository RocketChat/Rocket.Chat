RocketChat.callbacks.add 'oembed:beforeGetUrlContent', (data) ->
	# if data.parsedUrl is 'soundcloud.com'
		# Do whatever you whant in sync way
		# You can modify the object data.requestOptions to change how the request will be executed


RocketChat.callbacks.add 'oembed:afterParseContent', (data) ->
	# if data.parsedUrl is 'soundcloud.com'
		# Do whatever you whant in sync way
		# You can modify the object data to change the parsed object
