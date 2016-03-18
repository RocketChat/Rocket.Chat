URL = Npm.require('url')
querystring = Npm.require('querystring')
request = Npm.require('request')

OEmbed = {}

getUrlContent = (urlObj, redirectCount = 5, callback) ->
	if _.isString(urlObj)
		urlObj = URL.parse urlObj

	parsedUrl = _.pick urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search']

	RocketChat.callbacks.run 'oembed:beforeGetUrlContent',
		requestOptions: urlObj
		parsedUrl: parsedUrl

	request {
		url: URL.format urlObj
		strictSSL: !RocketChat.settings.get 'Allow_Invalid_SelfSigned_Certs'
		gzip: true
		maxRedirects: redirectCount
		headers:
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
	}, Meteor.bindEnvironment (error, response, body) ->
		if error?
			return callback null, {
				error: error
				parsedUrl: parsedUrl
			}

		if response.statusCode isnt 200
			return callback null, {parsedUrl: parsedUrl}

		callback null, {
			headers: response.headers
			body: body
			parsedUrl: parsedUrl
		}

OEmbed.getUrlMeta = (url, withFragment) ->
	getUrlContentSync = Meteor.wrapAsync getUrlContent

	urlObj = URL.parse url

	if withFragment?
		queryStringObj = querystring.parse urlObj.query
		queryStringObj._escaped_fragment_ = ''
		urlObj.query = querystring.stringify queryStringObj

		path = urlObj.pathname
		if urlObj.query?
			path += '?' + urlObj.query

		urlObj.path = path

	content = getUrlContentSync urlObj, 5

	metas = undefined

	if content?.body?
		metas = {}
		content.body.replace /<title>((.|\n)+?)<\/title>/gmi, (meta, title) ->
			metas.pageTitle = title

		content.body.replace /<meta[^>]*(?:name|property)=[']([^']*)['][^>]*content=[']([^']*)['][^>]*>/gmi, (meta, name, value) ->
			metas[changeCase.camelCase(name)] = value

		content.body.replace /<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*content=["]([^"]*)["][^>]*>/gmi, (meta, name, value) ->
			metas[changeCase.camelCase(name)] = value

		content.body.replace /<meta[^>]*content=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gmi, (meta, value, name) ->
			metas[changeCase.camelCase(name)] = value

		content.body.replace /<meta[^>]*content=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gmi, (meta, value, name) ->
			metas[changeCase.camelCase(name)] = value


		if metas.fragment is '!' and not withFragment?
			return OEmbed.getUrlMeta url, true

	headers = undefined

	if content?.headers?
		headers = {}
		for header, value of content.headers
			headers[changeCase.camelCase(header)] = value

	RocketChat.callbacks.run 'oembed:afterParseContent',
		meta: metas
		headers: headers
		parsedUrl: content.parsedUrl
		content: content

	return {
		meta: metas
		headers: headers
		parsedUrl: content.parsedUrl
	}

OEmbed.getUrlMetaWithCache = (url, withFragment) ->
	cache = RocketChat.models.OEmbedCache.findOneById url
	if cache?
		return cache.data

	data = OEmbed.getUrlMeta url, withFragment

	if data?
		RocketChat.models.OEmbedCache.createWithIdAndData url, data

		return data

	return

getRelevantHeaders = (headersObj) ->
	headers = {}
	for key, value of headersObj
		if key.toLowerCase() in ['contenttype', 'contentlength'] and value?.trim() isnt ''
			headers[key] = value

	if Object.keys(headers).length > 0
		return headers
	return

getRelevantMetaTags = (metaObj) ->
	tags = {}
	for key, value of metaObj
		if /^(og|fb|twitter|oembed).+|description|title|pageTitle$/.test(key.toLowerCase()) and value?.trim() isnt ''
			tags[key] = value

	if Object.keys(tags).length > 0
		return tags
	return

OEmbed.RocketUrlParser = (message) ->
	if Array.isArray message.urls
		changed = false
		for item in message.urls
			data = OEmbed.getUrlMetaWithCache item.url

			if data?
				if data.meta?
					item.meta = getRelevantMetaTags data.meta

				if data.headers?
					item.headers = getRelevantHeaders data.headers

				item.parsedUrl = data.parsedUrl
				changed = true

		if changed is true
			RocketChat.models.Messages.setUrlsById message._id, message.urls

	return message

RocketChat.settings.get 'API_Embed', (key, value) ->
	if value
		RocketChat.callbacks.add 'afterSaveMessage', OEmbed.RocketUrlParser, RocketChat.callbacks.priority.LOW, 'API_Embed'
	else
		RocketChat.callbacks.remove 'afterSaveMessage', 'API_Embed'
