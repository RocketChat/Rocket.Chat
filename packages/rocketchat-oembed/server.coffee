URL = Npm.require('url')
http = Npm.require('http')
https = Npm.require('https')
querystring = Npm.require('querystring')

getUrlContent = (urlObj, redirectCount = 5, callback) ->
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
			}

	request.end()

getUrlMeta = (url, withFragment) ->
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

	return {
		meta: metas
		headers: content?.headers
	}


Meteor.methods
	getUrlMeta: (url) ->
		data = getUrlMeta url

		if data.meta.fragment is '!'
			data = getUrlMeta url, true

		console.log data.meta
		console.log data.headers

		return data