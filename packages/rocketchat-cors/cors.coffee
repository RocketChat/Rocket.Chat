# Adding CORS headers so we can use CDNs for static content

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
