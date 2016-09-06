# Request custom OAuth credentials for the user
# @param options {optional}
# @param credentialRequestCompleteCallback {Function} Callback function to call on
#   completion. Takes one argument, credentialToken on success, or Error on
#   error.
class CustomOAuth
	constructor: (@name, options) ->
		if not Match.test @name, String
			return throw new Meteor.Error 'CustomOAuth: Name is required and must be String'

		@configure options

		Accounts.oauth.registerService @name

		@configureLogin()

	configure: (options) ->
		if not Match.test options, Object
			return throw new Meteor.Error 'CustomOAuth: Options is required and must be Object'

		if not Match.test options.serverURL, String
			return throw new Meteor.Error 'CustomOAuth: Options.serverURL is required and must be String'

		if not Match.test options.authorizePath, String
			options.authorizePath = '/oauth/authorize'

		if not Match.test options.scope, String
			options.scope = 'openid'

		@serverURL = options.serverURL
		@authorizePath = options.authorizePath
		@scope = options.scope

		if not /^https?:\/\/.+/.test @authorizePath
			@authorizePath = @serverURL + @authorizePath

	configureLogin: ->
		self = @
		loginWithService = "loginWith" + s.capitalize(@name)

		Meteor[loginWithService] = (options, callback) ->
			# support a callback without options
			if not callback and typeof options is "function"
				callback = options
				options = null

			credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback)
			self.requestCredential(options, credentialRequestCompleteCallback)

	requestCredential: (options, credentialRequestCompleteCallback) ->
		# support both (options, callback) and (callback).
		if not credentialRequestCompleteCallback and typeof options is 'function'
			credentialRequestCompleteCallback = options
			options = {}

		config = ServiceConfiguration.configurations.findOne service: @name
		if not config
			credentialRequestCompleteCallback? new ServiceConfiguration.ConfigError()
			return

		credentialToken = Random.secret()
		loginStyle = OAuth._loginStyle @name, config, options

		loginUrl = @authorizePath +
			'?client_id=' + config.clientId +
			'&redirect_uri=' + OAuth._redirectUri(@name, config) +
			'&response_type=code' +
			'&state=' + OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl) +
			'&scope=' + @scope

		OAuth.launchLogin
			loginService: @name
			loginStyle: loginStyle
			loginUrl: loginUrl
			credentialRequestCompleteCallback: credentialRequestCompleteCallback
			credentialToken: credentialToken
			popupOptions:
				width: 900
				height: 450
