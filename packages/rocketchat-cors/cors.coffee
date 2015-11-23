# Adding CORS headers so we can use CDNs for static content

WebApp.rawConnectHandlers.use (req, res, next) ->
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("X-Rocket-Chat-Version", VERSION)
	return next()

_staticFilesMiddleware = WebAppInternals.staticFilesMiddleware
WebAppInternals._staticFilesMiddleware = (staticFiles, req, res, next) ->
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("X-Rocket-Chat-Version", VERSION)
	_staticFilesMiddleware(staticFiles, req, res, next)
