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
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("X-Rocket-Chat-Version", VERSION)
	res.setHeader("Access-Control-Expose-Headers",  "X-Rocket-Chat-Version")

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
	res.setHeader("X-Rocket-Chat-Version", VERSION)
	res.setHeader("Access-Control-Expose-Headers",  "X-Rocket-Chat-Version")
	_staticFilesMiddleware(staticFiles, req, res, next)
