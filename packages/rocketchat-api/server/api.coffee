class API extends Restivus
	constructor: ->
		@authMethods = []
		super

	addAuthMethod: (method) ->
		@authMethods.push method

	success: (result={}) ->
		if _.isObject(result)
			result.success = true

		return {} =
			statusCode: 200
			body: result

	failure: (result) ->
		if _.isObject(result)
			result.success = false
		else
			result =
				success: false
				error: result

		return {} =
			statusCode: 400
			body: result

	unauthorized: (msg) ->
		return {} =
			statusCode: 403
			body:
				success: false
				error: msg or 'unauthorized'


RocketChat.API = {}


RocketChat.API.v1 = new API
	version: 'v1'
	useDefaultAuth: true
	prettyJson: true
	enableCors: false
	auth:
		token: 'services.resume.loginTokens.hashedToken'
		user: ->
			if @bodyParams?.payload?
				@bodyParams = JSON.parse @bodyParams.payload

			for method in RocketChat.API.v1.authMethods
				result = method.apply @, arguments
				if result not in [undefined, null, false]
					return result

			if @request.headers['x-auth-token']
				token = Accounts._hashLoginToken @request.headers['x-auth-token']

			return {} =
				userId: @request.headers['x-user-id']
				token: token
