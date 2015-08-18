URL = Npm.require('url')
http = Npm.require('http')
https = Npm.require('https')
querystring = Npm.require('querystring')

OEmbed =
	cache: new Meteor.Collection 'rocketchat_oembed_cache'

getUrlContent = (urlObj, redirectCount = 5, callback) ->
	if _.isString(urlObj)
		urlObj = URL.parse urlObj

	opts =
		method: 'GET'
		port: urlObj.port
		hostname: urlObj.hostname
		path: urlObj.path

	httpOrHttps = if urlObj.protocol is 'https:' then https else http

	parsedUrl = _.pick urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query']

	request = httpOrHttps.request opts, (response) ->
		if response.statusCode is 301 and response.headers.location?
			request.abort()
			console.log response.headers.location

			if redirectCount <= 0
				return callback null, {parsedUrl: parsedUrl}

			getUrlContent response.headers.location, --redirectCount, callback
			return

		if response.statusCode isnt 200
			return callback null, {parsedUrl: parsedUrl}

		str = ''
		response.on 'data', (chunk) ->
			str += chunk
			if str.length > 250000
				request.abort()

		response.on 'end', ->
			callback null, {
				headers: response.headers
				body: str
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
		content.body.replace /<title>(.+)<\/title>/gmi, (meta, title) ->
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

	return {
		meta: metas
		headers: headers
		parsedUrl: content.parsedUrl
	}

OEmbed.getUrlMetaWithCache = (url, withFragment) ->
	cache = OEmbed.cache.findOne {_id: url}
	if cache?
		return cache.data

	data = OEmbed.getUrlMeta url, withFragment

	if data?
		OEmbed.cache.insert {_id: url, data: data, updatedAt: new Date}

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
		if /^(og|fb|twitter).+|description|title|pageTitle$/.test(key.toLowerCase()) and value?.trim() isnt ''
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
			ChatMessage.update {_id: message._id}, { $set: { urls: message.urls } }

	return message

if RocketChat.settings.get 'API_Embed'
	RocketChat.callbacks.add 'afterSaveMessage', OEmbed.RocketUrlParser, RocketChat.callbacks.priority.LOW
