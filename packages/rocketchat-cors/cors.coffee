# Adding CORS headers so we can use CDNs for static content

# Try to parse all request bodies as JSON
WebApp.rawConnectHandlers.use (req, res, next) ->
	if req._body
		return next()

	if req.headers['transfer-encoding'] is undefined and isNaN(req.headers['content-length'])
		return next()

	if req.headers['content-type'] not in ['', undefined]
		return next()

	buf = ''
	req.setEncoding('utf8')
	req.on 'data', (chunk) -> buf += chunk
	req.on 'end', ->
		if RocketChat?.debugLevel? and RocketChat.debugLevel is 'debug'
			console.log '[request]'.green, req.method, req.url, '\nheaders ->', req.headers, '\nbody ->', buf

		try
			req.body = JSON.parse(buf)
		catch err
			req.body = buf

		req._body = true
		next()


WebApp.rawConnectHandlers.use (req, res, next) ->
	if /^\/(api|_timesync|sockjs|tap-i18n)(\/|$)/.test req.url
		res.setHeader("Access-Control-Allow-Origin", "*")

	# Block next handlers to override CORS with value http://meteor.local
	setHeader = res.setHeader
	res.setHeader = (key, val) ->
		if key.toLowerCase() is 'access-control-allow-origin' and val is 'http://meteor.local'
			return
		return setHeader.apply @, arguments

	return next()

_staticFilesMiddleware = WebAppInternals.staticFilesMiddleware
WebAppInternals._staticFilesMiddleware = (staticFiles, req, res, next) ->
	res.setHeader("Access-Control-Allow-Origin", "*")
	_staticFilesMiddleware(staticFiles, req, res, next)


url = Npm.require("url")

httpServer = WebApp.httpServer
oldHttpServerListeners = httpServer.listeners('request').slice(0)
httpServer.removeAllListeners('request')

httpServer.addListener 'request', (req, res) ->
	args = arguments
	next = ->
		for oldListener in oldHttpServerListeners
			oldListener.apply(httpServer, args)

	if RocketChat.settings.get('Force_SSL') isnt true
		next()
		return

	remoteAddress = req.connection.remoteAddress or req.socket.remoteAddress

	localhostRegexp = /^\s*(127\.0\.0\.1|::1)\s*$/
	localhostTest = (x) ->
		return localhostRegexp.test(x)

	isLocal = localhostRegexp.test(remoteAddress) and (not req.headers['x-forwarded-for'] or _.all(req.headers['x-forwarded-for'].split(','), localhostTest))

	isSsl = req.connection.pair or (req.headers['x-forwarded-proto'] and req.headers['x-forwarded-proto'].indexOf('https') isnt -1)

	if RocketChat?.debugLevel? and RocketChat.debugLevel is 'debug'
		console.log 'req.url', req.url
		console.log 'remoteAddress', remoteAddress
		console.log 'isLocal', isLocal
		console.log 'isSsl', isSsl
		console.log 'req.headers', req.headers

	if not isLocal and not isSsl
		host = req.headers['host'] or url.parse(Meteor.absoluteUrl()).hostname

		host = host.replace(/:\d+$/, '')

		res.writeHead 302,
			'Location': 'https://' + host + req.url
		res.end()
		return

	next()
