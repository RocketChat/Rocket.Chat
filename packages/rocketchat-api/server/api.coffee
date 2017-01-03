class API extends Restivus
	constructor: ->
		@authMethods = []
		@roomFieldsToExclude =
			joinCode: 0
			$loki: 0
			meta: 0
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

	# If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
	# If the count query param isn't defined, then we set it to the "API_Default_Count" setting
	# If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
	getPaginationItems: (req) ->
		hardUpperLimit = if RocketChat.settings.get('API_Upper_Count_Limit') <= 0 then 100 else RocketChat.settings.get('API_Upper_Count_Limit')
		defaultCount = if RocketChat.settings.get('API_Default_Count') <= 0 then 50 else RocketChat.settings.get('API_Default_Count')
		offset = if req.queryParams.offset then parseInt(req.queryParams.offset) else 0
		# Ensure count is an appropiate amount
		if typeof req.queryParams.count != 'undefined'
			count = parseInt(req.queryParams.count)
		else
			count = defaultCount

		if count > hardUpperLimit
			count = hardUpperLimit

		if count == 0 and !RocketChat.settings.get('API_Allow_Infinite_Count')
			count = defaultCount

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
