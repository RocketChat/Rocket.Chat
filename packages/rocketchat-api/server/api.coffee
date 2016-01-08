class API extends Restivus
	constructor: ->
		@authMethods = []
		super

	addAuthMethod: (method) ->
		@authMethods.push method


RocketChat.API = {}


RocketChat.API.v1 = new API
	version: 'v1'
	useDefaultAuth: true
	prettyJson: false
	enableCors: false
	auth:
		token: 'services.resume.loginTokens.hashedToken'
		user: ->
			for method in RocketChat.API.v1.authMethods
				result = method.apply @, arguments
				if result not in [undefined, null, false]
					return result

			if @request.headers['x-auth-token']
				token = Accounts._hashLoginToken @request.headers['x-auth-token']

			return {} =
				userId: @request.headers['x-user-id']
				token: token
