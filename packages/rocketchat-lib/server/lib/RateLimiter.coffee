RocketChat.RateLimiter = new class
	constructor: ->
		@rateLimiter = new RateLimiter()

	getErrorMessage: (rateLimitResult) ->
		return "Error, too many requests. Please slow down. You must wait #{Math.ceil(rateLimitResult.timeToReset / 1000)} seconds before trying again."

	addRule: (matcher, numRequests, timeInterval) ->
		if matcher.type isnt 'function'
			return DDPRateLimiter.addRule matcher, numRequests, timeInterval
		else
			return @rateLimiter.addRule matcher, numRequests, timeInterval

	check: (functionName, params) ->
		match =
			type: "function",
			name: functionName
			params: params

		@rateLimiter.increment(match)

		rateLimitResult = @rateLimiter.check(match)
		unless rateLimitResult.allowed
			console.log @getErrorMessage(rateLimitResult)
		return rateLimitResult.allowed

	getRules: ->
		return @rateLimiter.rules
