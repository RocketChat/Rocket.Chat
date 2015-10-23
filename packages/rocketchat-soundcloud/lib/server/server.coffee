URL = Npm.require('url')

RocketChat.callbacks.add 'oembed:beforeGetUrlContent', (data) ->
	if data.parsedUrl.host is 'soundcloud.com'
		newUrlObj = URL.format data.parsedUrl
		newUrlObj = URL.parse "https://soundcloud.com/oembed?url=" + encodeURIComponent newUrlObj + "&format=json&maxheight=150"
		data.requestOptions.port = newUrlObj.port
		data.requestOptions.hostname = newUrlObj.hostname
		data.requestOptions.path = newUrlObj.path

RocketChat.callbacks.add 'oembed:afterParseContent', (data) ->
	if data.parsedUrl.host is 'soundcloud.com'
		if data.content?.body?
			metas = JSON.parse data.content.body;
			_.each metas, (value, key) ->
				if _.isString value
					data.meta[changeCase.camelCase('oembed_' + key)] = value
		if data.parsedUrl?
			data.meta['oembedUrl'] = URL.format data.parsedUrl
