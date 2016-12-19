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

	getPaginationItems: (req) ->
		console.log(req)
		offset = if req.queryParams.offset then parseInt(req.queryParams.offset) else 0
		count = if req.queryParams.count then parseInt(req.queryParams.count) else 25
		count = 100 if count > 100
		return {} =
			offset: offset
			count: count

RocketChat.API = {}

getUserAuth = ->
	return {
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
	}


RocketChat.API.v1 = new API
	version: 'v1'
	useDefaultAuth: true
	prettyJson: true
	enableCors: false
	auth: getUserAuth()

RocketChat.API.default = new API
	useDefaultAuth: true
	prettyJson: true
	enableCors: false
	auth: getUserAuth()
