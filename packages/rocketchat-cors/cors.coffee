# Adding CORS headers so we can use CDNs for static content

WebApp.rawConnectHandlers.use (req, res, next) ->
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("X-Rocket-Chat-Version", VERSION)
	res.setHeader("Access-Control-Expose-Headers",  "X-Rocket-Chat-Version")
	return next()

_staticFilesMiddleware = WebAppInternals.staticFilesMiddleware
WebAppInternals._staticFilesMiddleware = (staticFiles, req, res, next) ->
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("X-Rocket-Chat-Version", VERSION)
	res.setHeader("Access-Control-Expose-Headers",  "X-Rocket-Chat-Version")
	_staticFilesMiddleware(staticFiles, req, res, next)
