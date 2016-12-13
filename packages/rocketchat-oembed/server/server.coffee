URL = Npm.require('url')
querystring = Npm.require('querystring')
request = HTTPInternals.NpmModules.request.module
iconv = Npm.require('iconv-lite')
ipRangeCheck = Npm.require('ip-range-check')
he = Npm.require('he')
jschardet = Npm.require('jschardet')

OEmbed = {}

# Detect encoding
# Priority:
#   Detected == HTTP Header > Detected == HTML meta > HTTP Header > HTML meta > Detected > Default (utf-8)
#   See also: https://www.w3.org/International/questions/qa-html-encoding-declarations.en#quickanswer
getCharset = (contentType, body) ->
	contentType = contentType || ''
	binary = body.toString('binary')

	detected = jschardet.detect(binary)
	if detected.confidence > 0.8
		detectedCharset = detected.encoding.toLowerCase()

	m1 = contentType.match(/charset=([\w\-]+)/i)
	if m1
		httpHeaderCharset = m1[1].toLowerCase()

	m2 = binary.match(/<meta\b[^>]*charset=["']?([\w\-]+)/i)
	if m2
		htmlMetaCharset = m2[1].toLowerCase()

	if detectedCharset
		if detectedCharset == httpHeaderCharset
			result = httpHeaderCharset
		else if detectedCharset == htmlMetaCharset
			result = htmlMetaCharset

	unless result
		result = httpHeaderCharset || htmlMetaCharset || detectedCharset

	return result || 'utf-8'

toUtf8 = (contentType, body) ->
	return iconv.decode(body, getCharset(contentType, body))

getUrlContent = (urlObj, redirectCount = 5, callback) ->
	if _.isString(urlObj)
		urlObj = URL.parse urlObj

	parsedUrl = _.pick urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search', 'hostname']

	ignoredHosts = RocketChat.settings.get('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') or []
	if parsedUrl.hostname in ignoredHosts or ipRangeCheck(parsedUrl.hostname, ignoredHosts)
		return callback()

	safePorts = RocketChat.settings.get('API_EmbedSafePorts').replace(/\s/g, '').split(',') or []
	if parsedUrl.port and safePorts.length > 0 and parsedUrl.port not in safePorts
		return callback()

	data = RocketChat.callbacks.run 'oembed:beforeGetUrlContent',
		urlObj: urlObj
		parsedUrl: parsedUrl

	if data.attachments?
		return callback null, data

	url = URL.format data.urlObj
	opts =
		url: url
		strictSSL: !RocketChat.settings.get 'Allow_Invalid_SelfSigned_Certs'
		gzip: true
		maxRedirects: redirectCount
		headers:
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'

	headers = null
	statusCode = null
	error = null
	chunks = []
	chunksTotalLength = 0

	stream = request opts
	stream.on 'response', (response) ->
		statusCode = response.statusCode
		headers = response.headers
		if response.statusCode isnt 200
			return stream.abort()

	stream.on 'data', (chunk) ->
		chunks.push chunk
		chunksTotalLength += chunk.length
		if chunksTotalLength > 250000
			stream.abort()

	stream.on 'end', Meteor.bindEnvironment ->
		if error?
			return callback null, {
				error: error
				parsedUrl: parsedUrl
			}

		buffer = Buffer.concat(chunks)

		callback null, {
			headers: headers
			body: toUtf8(headers['content-type'], buffer)
			parsedUrl: parsedUrl
			statusCode: statusCode
		}

	stream.on 'error', (err) ->
		error = err

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
	if !content
		return

	if content.attachments?
		return content

	metas = undefined

	if content?.body?
		metas = {}
		content.body.replace /<title[^>]*>([^<]*)<\/title>/gmi, (meta, title) ->
			metas.pageTitle ?= he.unescape title

		content.body.replace /<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gmi, (meta, name, value) ->
			metas[changeCase.camelCase(name)] ?= he.unescape value

		content.body.replace /<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gmi, (meta, name, value) ->
			metas[changeCase.camelCase(name)] ?= he.unescape value

		content.body.replace /<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gmi, (meta, value, name) ->
			metas[changeCase.camelCase(name)] ?= he.unescape value

		content.body.replace /<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gmi, (meta, value, name) ->
			metas[changeCase.camelCase(name)] ?= he.unescape value


		if metas.fragment is '!' and not withFragment?
			return OEmbed.getUrlMeta url, true

	headers = undefined

	if content?.headers?
		headers = {}
		for header, value of content.headers
			headers[changeCase.camelCase(header)] = value

	if content?.statusCode isnt 200
		return data

	data = RocketChat.callbacks.run 'oembed:afterParseContent',
		meta: metas
		headers: headers
		parsedUrl: content.parsedUrl
		content: content

	return data

OEmbed.getUrlMetaWithCache = (url, withFragment) ->
	cache = RocketChat.models.OEmbedCache.findOneById url
	if cache?
		return cache.data

	data = OEmbed.getUrlMeta url, withFragment

	if data?
		try
			RocketChat.models.OEmbedCache.createWithIdAndData url, data
		catch e
			console.error 'OEmbed duplicated record', url

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
		attachments = []
		changed = false
		message.urls.forEach (item) ->
			if item.ignoreParse is true then return
			if item.url.startsWith "grain://"
				changed = true
				item.meta =
					sandstorm:
						grain: item.sandstormViewInfo
				return

			if not /^https?:\/\//i.test item.url then return

			data = OEmbed.getUrlMetaWithCache item.url

			if data?
				if data.attachments
					attachments = _.union attachments, data.attachments
				else
					if data.meta?
						item.meta = getRelevantMetaTags data.meta

					if data.headers?
						item.headers = getRelevantHeaders data.headers

					item.parsedUrl = data.parsedUrl
					changed = true

		if attachments.length
			RocketChat.models.Messages.setMessageAttachments message._id, attachments

		if changed is true
			RocketChat.models.Messages.setUrlsById message._id, message.urls

	return message

RocketChat.settings.get 'API_Embed', (key, value) ->
	if value
		RocketChat.callbacks.add 'afterSaveMessage', OEmbed.RocketUrlParser, RocketChat.callbacks.priority.LOW, 'API_Embed'
	else
		RocketChat.callbacks.remove 'afterSaveMessage', 'API_Embed'
