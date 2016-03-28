URL = Npm.require('url')
http = Npm.require('http')
https = Npm.require('https')
zlib = Npm.require('zlib')
querystring = Npm.require('querystring')
iconv = Npm.require('iconv-lite')

gunzipSync = Meteor.wrapAsync zlib.gunzip.bind(zlib)
inflateSync = Meteor.wrapAsync zlib.inflate.bind(zlib)

OEmbed = {}

# Detect encoding
getCharset = (body) ->
	binary = body.toString 'binary'
	matches = binary.match /<meta\b[^>]*charset=["']?([\w\-]+)/i
	if matches
		return matches[1]
	return 'utf-8'

toUtf8 = (body) ->
	return iconv.decode body, getCharset(body)

getUrlContent = (urlObj, redirectCount = 5, callback) ->
	if _.isString(urlObj)
		urlObj = URL.parse urlObj

	opts =
		method: 'GET'
		port: urlObj.port
		hostname: urlObj.hostname
		path: urlObj.path
		rejectUnauthorized: !RocketChat.settings.get 'Allow_Invalid_SelfSigned_Certs'
		headers:
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'

	httpOrHttps = if urlObj.protocol is 'https:' then https else http

	parsedUrl = _.pick urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search']

	RocketChat.callbacks.run 'oembed:beforeGetUrlContent',
		requestOptions: opts
		parsedUrl: parsedUrl

	request = httpOrHttps.request opts, Meteor.bindEnvironment (response) ->
		if response.statusCode in [301,302,307] and response.headers.location?
			request.abort()
			console.log response.headers.location

			if redirectCount <= 0
				return callback null, {parsedUrl: parsedUrl}

			getUrlContent response.headers.location, --redirectCount, callback
			return

		if response.statusCode isnt 200
			return callback null, {parsedUrl: parsedUrl}

		chunks = []
		chunksTotalLength = 0
		response.on 'data', (chunk) ->
			chunks.push chunk
			chunksTotalLength += chunk.length
			if chunksTotalLength > 250000
				request.abort()

		response.on 'end', Meteor.bindEnvironment ->
			buffer = Buffer.concat(chunks)

			try
				if response.headers['content-encoding'] is 'gzip'
					buffer = gunzipSync buffer
				else if response.headers['content-encoding'] is 'deflate'
					buffer = inflateSync buffer

			callback null, {
				headers: response.headers
				body: toUtf8 buffer
				parsedUrl: parsedUrl
			}

		response.on 'error', (error) ->
			callback null, {
				error: error
				parsedUrl: parsedUrl
			}

	request.on 'error', (error) ->
		callback null, {
			error: error
			parsedUrl: parsedUrl
		}

	request.end()

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
