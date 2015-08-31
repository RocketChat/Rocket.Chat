Services = {}

class CustomOAuth
	constructor: (@name, options) ->
		if not Match.test @name, String
			return throw new Meteor.Error 'CustomOAuth: Name is required and must be String'

		if Services[@name]?
			Services[@name].configure options
			return

		Services[@name] = @

		@configure options

		@userAgent = "Meteor"
		if Meteor.release
			@userAgent += '/' + Meteor.release

		Accounts.oauth.registerService @name
		@registerService()

	configure: (options) ->
		if not Match.test options, Object
			return throw new Meteor.Error 'CustomOAuth: Options is required and must be Object'

		if not Match.test options.serverURL, String
			return throw new Meteor.Error 'CustomOAuth: Options.serverURL is required and must be String'

		if not Match.test options.tokenPath, String
			options.tokenPath = '/oauth/token'

		@serverURL = options.serverURL
		@tokenPath = options.tokenPath

		if Match.test options.addAutopublishFields, Object
			Accounts.addAutopublishFields options.addAutopublishFields

	getAccessToken: (query) ->
		config = ServiceConfiguration.configurations.findOne service: @name
		if not config?
			throw new ServiceConfiguration.ConfigError()
		console.log config

		response = undefined
		try
			console.log @serverURL + @tokenPath
			response = HTTP.post @serverURL + @tokenPath,
				headers:
					Accept: 'application/json'
					'User-Agent': @userAgent
				params:
					code: query.code
					client_id: config.clientId
					client_secret: OAuth.openSecret(config.secret)
					redirect_uri: OAuth._redirectUri(@name, config)
					grant_type: 'authorization_code'
					state: query.state
			console.log
				headers:
					Accept: 'application/json'
					'User-Agent': @userAgent
				params:
					code: query.code
					client_id: config.clientId
					client_secret: OAuth.openSecret(config.secret)
					redirect_uri: OAuth._redirectUri(@name, config)
					grant_type: 'authorization_code'
					state: query.state

		catch err
			error = new Error("Failed to complete OAuth handshake with #{@name}. " + err.message)
			throw _.extend error, {response: err.response}

		if response.data.error #if the http response was a json object with an error attribute
			throw new Error("Failed to complete OAuth handshake with #{@name}. " + response.data.error)
		else
			return response.data.access_token

	getIdentity: (accessToken) ->
		try
			response = HTTP.get @serverURL + "/api/v3/user",
				headers:
					'User-Agent': @userAgent # http://doc.gitlab.com/ce/api/users.html#Current-user
				params:
					access_token: accessToken

			return response.data

		catch err
			error = new Error("Failed to fetch identity from #{@name}. " + err.message)
			throw _.extend error, {response: err.response}

	registerService: ->
		self = @
		OAuth.registerService @name, 2, null, (query) ->
			accessToken = self.getAccessToken query
			console.log 'at:', accessToken

			identity = self.getIdentity accessToken
			console.log 'id:', JSON.stringify identity

			primaryEmail = identity.email
			console.log 'primay:', JSON.stringify primaryEmail

			return {
				serviceData:
					id: identity.id
					accessToken: OAuth.sealSecret(accessToken)
					email: identity.email or ''
					username: identity.username
					emails: [
						identity.email
					]
				options:
					profile:
						name: identity.username
			}

	retrieveCredential: (credentialToken, credentialSecret) ->
		return OAuth.retrieveCredential credentialToken, credentialSecret
