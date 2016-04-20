RocketChat.RateLimiter = new class
	limitFunction: (fn, numRequests, timeInterval, matchers) ->
		rateLimiter = new RateLimiter()
		rateLimiter.addRule matchers, numRequests, timeInterval
		return ->
			match = {}
			args = arguments
			_.each matchers, (matcher, key) ->
				match[key] = args[key]

			rateLimiter.increment match
			rateLimitResult = rateLimiter.check match
			if rateLimitResult.allowed
				return fn.apply null, arguments
			else
				throw new Meteor.Error 'error-too-many-requests', "Error, too many requests. Please slow down. You must wait #{Math.ceil(rateLimitResult.timeToReset / 1000)} seconds before trying again.", { timeToReset: rateLimitResult.timeToReset, seconds: Math.ceil(rateLimitResult.timeToReset / 1000) }

	limitMethod: (methodName, numRequests, timeInterval, matchers) ->
		match =
			type: 'method'
			name: methodName

		_.each matchers, (matcher, key) ->
			match[key] = matchers[key]

		DDPRateLimiter.addRule match, numRequests, timeInterval
