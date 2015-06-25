URL = Npm.require('url')
http = Npm.require('http')
https = Npm.require('https')
querystring = Npm.require('querystring')

OEmbed = {}

getUrlContent = (urlObj, redirectCount = 5, callback) ->
	if _.isString(urlObj)
		urlObj = URL.parse urlObj

	opts =
		method: 'GET'
		port: urlObj.port
		hostname: urlObj.hostname
		path: urlObj.path

	httpOrHttps = if urlObj.protocol is 'https:' then https else http

	request = httpOrHttps.request opts, (response) ->
		if response.statusCode is 301 and response.headers.location?
			request.abort()
			console.log response.headers.location

			if redirectCount <= 0
				return callback null, null

			getUrlContent response.headers.location, --redirectCount, callback
			return

		if response.statusCode isnt 200
			return callback null, null

		str = ''
		response.on 'data', (chunk) ->
			str += chunk
			if str.length > 250000
				request.abort()

		response.on 'end', ->
			callback null, {
				headers: response.headers
				body: str
				parsedUrl: _.pick urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query']
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

	metas = {}

	content?.body.replace /<meta.*(?:name|property)=['"]([^'"]*)['"].*content=['"]([^'"]*)['"].*>/gmi, (meta, name, value) ->
		metas[name] = value

	if metas.fragment is '!' and not withFragment?
		return OEmbed.getUrlMeta url, true

	return {
		meta: metas
		headers: content?.headers
		parsedUrl: content.parsedUrl
	}

getRelevantHeaders = (headersObj) ->
	headers = {}
	for key, value of headersObj
		key = key.toLowerCase()
		if key in ['content-type', 'content-length'] and value?.trim() isnt ''
			headers[key.replace(/\./g, '-')] = value

	if Object.keys(headers).length > 0
		return headers
	return

getRelevantMetaTags = (metaObj) ->
	tags = {}
	for key, value of metaObj
		key = key.toLowerCase()
		if /^(og|fb|twitter):.+|description$/.test(key) and value?.trim() isnt ''
			tags[key.replace(/\./g, '-')] = value

	if Object.keys(tags).length > 0
		return tags
	return

RocketUrlParser = (message) ->
	if Array.isArray message.urls
		for item in message.urls
			data = OEmbed.getUrlMeta item.url

			if data?.meta?
				item.meta = getRelevantMetaTags data.meta

			if data?.headers?
				item.headers = getRelevantHeaders data.headers

			item.parsedUrl = data.parsedUrl

		ChatMessage.update {_id: message._id}, { $set: { urls: message.urls } }

RocketChat.callbacks.add 'afterSaveMessage', RocketUrlParser, RocketChat.callbacks.priority.LOW

# Meteor.methods
# 	getUrlMeta: (url) ->
# 		data = OEmbed.getUrlMeta url

# 		console.log data.meta
# 		console.log data.headers

# 		return data