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

		if not Match.test options.identityPath, String
			options.identityPath = '/me'

		@serverURL = options.serverURL
		@tokenPath = options.tokenPath
		@identityPath = options.identityPath

		if not /^https?:\/\/.+/.test @tokenPath
			@tokenPath = @serverURL + @tokenPath

		if not /^https?:\/\/.+/.test @identityPath
			@identityPath = @serverURL + @identityPath

		if Match.test options.addAutopublishFields, Object
			Accounts.addAutopublishFields options.addAutopublishFields

	getAccessToken: (query) ->
		config = ServiceConfiguration.configurations.findOne service: @name
		if not config?
			throw new ServiceConfiguration.ConfigError()

		response = undefined
		try
			response = HTTP.post @tokenPath,
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
			error = new Error("Failed to complete OAuth handshake with #{@name} at #{@tokenPath}. " + err.message)
			throw _.extend error, {response: err.response}

		if response.data.error #if the http response was a json object with an error attribute
			throw new Error("Failed to complete OAuth handshake with #{@name} at #{@tokenPath}. " + response.data.error)
		else
			return response.data.access_token

	getIdentity: (accessToken) ->
		try
			response = HTTP.get @identityPath,
				headers:
					'User-Agent': @userAgent # http://doc.gitlab.com/ce/api/users.html#Current-user
					'Authorization': 'Bearer ' + accessToken
				params:
					access_token: accessToken

			if response.data
				return response.data
			else
				return JSON.parse response.content

		catch err
			error = new Error("Failed to fetch identity from #{@name} at #{@identityPath}. " + err.message)
			throw _.extend error, {response: err.response}

	registerService: ->
		self = @
		OAuth.registerService @name, 2, null, (query) ->
			accessToken = self.getAccessToken query
			console.log 'at:', accessToken

			identity = self.getIdentity accessToken

			# Fix WordPress-like identities having 'ID' instead of 'id'
			if identity?.ID and not identity.id
				identity.id = identity.ID

			# Fix Auth0-like identities having 'user_id' instead of 'id'
			if identity?.user_id and not identity.id
				identity.id = identity.user_id

			console.log 'id:', JSON.stringify identity, null, '  '

			serviceData =
				_OAuthCustom: true
				accessToken: accessToken

			_.extend serviceData, identity

			data =
				serviceData: serviceData
				options:
					profile:
						name: identity.name or identity.username or identity.nickname

			console.log data

			return data

	retrieveCredential: (credentialToken, credentialSecret) ->
		return OAuth.retrieveCredential credentialToken, credentialSecret
