URL = Npm.require('url')
querystring = Npm.require('querystring')
request = HTTPInternals.NpmModules.request.module

OEmbed = {}

getUrlContent = (urlObj, redirectCount = 5, callback) ->
	if _.isString(urlObj)
		urlObj = URL.parse urlObj

	parsedUrl = _.pick urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search']

	RocketChat.callbacks.run 'oembed:beforeGetUrlContent',
		urlObj: urlObj
		parsedUrl: parsedUrl

	url = URL.format urlObj
	opts =
		url: url
		strictSSL: !RocketChat.settings.get 'Allow_Invalid_SelfSigned_Certs'
		gzip: true
		maxRedirects: redirectCount
		headers:
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'

	headers = null
	chunks = []
	chunksTotalLength = 0

	stream = request opts
	stream.on 'response', (response) ->
		if response.statusCode isnt 200
			return stream.abort()
		headers = response.headers

	stream.on 'data', (chunk) ->
		chunks.push chunk
		chunksTotalLength += chunk.length
		if chunksTotalLength > 250000
			stream.abort()

	stream.on 'end', Meteor.bindEnvironment ->
		buffer = Buffer.concat(chunks)
		callback null, {
			headers: headers
			body: buffer.toString()
			parsedUrl: parsedUrl
		}

	stream.on 'error', (error) ->
		callback null, {
			error: error
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
		message.urls.forEach (item) ->
			if not /^https?:\/\//i.test item.url then return

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
