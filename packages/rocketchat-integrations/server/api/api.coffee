vm = Npm.require('vm')

compiledScripts = {}

getIntegrationScript = (integration) ->
	compiledScript = compiledScripts[integration._id]
	if compiledScript? and +compiledScript._updatedAt is +integration._updatedAt
		return compiledScript.script

	script = integration.scriptCompiled
	vmScript = undefined
	sandbox =
		_: _
		s: s
		console: console
		Store:
			set: (key, val) ->
				return store[key] = val
			get: (key) ->
				return store[key]

	try
		logger.incoming.info 'will evaluate script'
		logger.incoming.debug script

		vmScript = vm.createScript script, 'script.js'

		vmScript.runInNewContext sandbox

		if sandbox.Script?
			compiledScripts[integration._id] =
				script: new sandbox.Script()
				_updatedAt: integration._updatedAt

			return compiledScripts[integration._id].script
	catch e
		logger.incoming.error "[Error evaluating Script:]"
		logger.incoming.error script.replace(/^/gm, '  ')
		logger.incoming.error "[Stack:]"
		logger.incoming.error e.stack.replace(/^/gm, '  ')
		throw RocketChat.API.v1.failure 'error-evaluating-script'

	if not sandbox.Script?
		throw RocketChat.API.v1.failure 'class-script-not-found'


Api = new Restivus
	enableCors: true
	apiPath: 'hooks/'
	auth:
		user: ->
			if @bodyParams?.payload?
				@bodyParams = JSON.parse @bodyParams.payload

			user = RocketChat.models.Users.findOne
				_id: @request.params.userId
				'services.resume.loginTokens.hashedToken': decodeURIComponent @request.params.token

			return user: user


Api.addRoute ':integrationId/:userId/:token', authRequired: true,
	post: ->
		logger.incoming.info 'Post integration'
		logger.incoming.debug '@urlParams', @urlParams
		logger.incoming.debug '@bodyParams', @bodyParams

		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)

		if integration.enabled isnt true
			return {} =
				statusCode: 503
				body: 'Service Unavailable'

		user = RocketChat.models.Users.findOne(@userId)

		defaultValues =
			channel: integration.channel
			alias: integration.alias
			avatar: integration.avatar
			emoji: integration.emoji


		if integration.scriptEnabled is true and integration.scriptCompiled? and integration.scriptCompiled.trim() isnt ''
			script = undefined
			try
				script = getIntegrationScript(integration)
			catch e
				return e

			request =
				url:
					hash: @request._parsedUrl.hash
					search: @request._parsedUrl.search
					query: @queryParams
					pathname: @request._parsedUrl.pathname
					path: @request._parsedUrl.path
				url_raw: @request.url
				url_params: @urlParams
				content: @bodyParams
				content_raw: @request.body
				headers: @request.headers
				user:
					_id: @user._id
					name: @user.name
					username: @user.username

			try
				result = script.process_incoming_request({ request: request })

				if result.error?
					return RocketChat.API.v1.failure result.error

				@bodyParams = result?.content

				logger.incoming.debug 'result', @bodyParams
			catch e
				logger.incoming.error "[Error running Script:]"
				logger.incoming.error integration.scriptCompiled.replace(/^/gm, '  ')
				logger.incoming.error "[Stack:]"
				logger.incoming.error e.stack.replace(/^/gm, '  ')
				return RocketChat.API.v1.failure 'error-running-script'

		if not @bodyParams?
			RocketChat.API.v1.failure 'body-empty'

		@bodyParams.bot =
			i: integration._id

		try
			message = processWebhookMessage @bodyParams, user, defaultValues

			if not message?
				return RocketChat.API.v1.failure 'unknown-error'

			return RocketChat.API.v1.success()
		catch e
			return RocketChat.API.v1.failure e.error


createIntegration = (options, user) ->
	logger.incoming.info 'Add integration'
	logger.incoming.debug options

	Meteor.runAsUser user._id, =>
		switch options['event']
			when 'newMessageOnChannel'
				options.data ?= {}

				if options.data.channel_name? and options.data.channel_name.indexOf('#') is -1
					options.data.channel_name = '#' + options.data.channel_name

				Meteor.call 'addOutgoingIntegration',
					username: 'rocket.cat'
					urls: [options.target_url]
					name: options.name
					channel: options.data.channel_name
					triggerWords: options.data.trigger_words

			when 'newMessageToUser'
				if options.data.username.indexOf('@') is -1
					options.data.username = '@' + options.data.username

				Meteor.call 'addOutgoingIntegration',
					username: 'rocket.cat'
					urls: [options.target_url]
					name: options.name
					channel: options.data.username
					triggerWords: options.data.trigger_words

	return RocketChat.API.v1.success()


removeIntegration = (options, user) ->
	logger.incoming.info 'Remove integration'
	logger.incoming.debug options

	integrationToRemove = RocketChat.models.Integrations.findOne urls: options.target_url
	Meteor.runAsUser user._id, =>
		Meteor.call 'deleteOutgoingIntegration', integrationToRemove._id

	return RocketChat.API.v1.success()


Api.addRoute 'add/:integrationId/:userId/:token', authRequired: true,
	post: ->
		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)

		if not integration?
			return RocketChat.API.v1.failure 'Invalid integration id'

		user = RocketChat.models.Users.findOne(@userId)

		return createIntegration @bodyParams, user


Api.addRoute 'remove/:integrationId/:userId/:token', authRequired: true,
	post: ->
		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)

		if not integration?
			return RocketChat.API.v1.failure 'Invalid integration id'

		user = RocketChat.models.Users.findOne(@userId)

		return removeIntegration @bodyParams, user


RocketChat.API.v1.addRoute 'integrations.create', authRequired: true,
	post: ->
		return createIntegration @bodyParams, @user


RocketChat.API.v1.addRoute 'integrations.remove', authRequired: true,
	post: ->
		return removeIntegration @bodyParams, @user


Api.addRoute 'sample/:integrationId/:userId/:token', authRequired: true,
	get: ->
		logger.incoming.info 'Sample Integration'

		return {} =
			statusCode: 200
			body: [
				token: Random.id(24)
				channel_id: Random.id()
				channel_name: 'general'
				timestamp: new Date
				user_id: Random.id()
				user_name: 'rocket.cat'
				text: 'Sample text 1'
				trigger_word: 'Sample'
			,
				token: Random.id(24)
				channel_id: Random.id()
				channel_name: 'general'
				timestamp: new Date
				user_id: Random.id()
				user_name: 'rocket.cat'
				text: 'Sample text 2'
				trigger_word: 'Sample'
			,
				token: Random.id(24)
				channel_id: Random.id()
				channel_name: 'general'
				timestamp: new Date
				user_id: Random.id()
				user_name: 'rocket.cat'
				text: 'Sample text 3'
				trigger_word: 'Sample'
			]


Api.addRoute 'info/:integrationId/:userId/:token', authRequired: true,
	get: ->
		logger.incoming.info 'Info integration'

		return {} =
			statusCode: 200
			body:
				success: true

