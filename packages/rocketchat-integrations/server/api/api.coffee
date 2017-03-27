vm = Npm.require('vm')
moment = require('moment')

compiledScripts = {}

buildSandbox = (store = {}) ->
	sandbox =
		_: _
		s: s
		console: console,
		moment: moment,
		Store:
			set: (key, val) ->
				return store[key] = val
			get: (key) ->
				return store[key]
		HTTP: (method, url, options) ->
			try
				return {} =
					result: HTTP.call method, url, options
			catch e
				return {} =
					error: e

	Object.keys(RocketChat.models).filter((k) ->
		return !k.startsWith('_')
	).forEach (k) =>
		sandbox[k] = RocketChat.models[k]

	return {} =
		store: store,
		sandbox: sandbox

getIntegrationScript = (integration) ->
	compiledScript = compiledScripts[integration._id]
	if compiledScript? and +compiledScript._updatedAt is +integration._updatedAt
		return compiledScript.script

	script = integration.scriptCompiled
	vmScript = undefined
	sandboxItems = buildSandbox()

	try
		logger.incoming.info 'Will evaluate script of Trigger', integration.name
		logger.incoming.debug script

		vmScript = vm.createScript script, 'script.js'

		vmScript.runInNewContext sandboxItems.sandbox

		if sandboxItems.sandbox.Script?
			compiledScripts[integration._id] =
				script: new sandboxItems.sandbox.Script()
				store: sandboxItems.store
				_updatedAt: integration._updatedAt

			return compiledScripts[integration._id].script
	catch e
		logger.incoming.error '[Error evaluating Script in Trigger', integration.name, ':]'
		logger.incoming.error script.replace(/^/gm, '  ')
		logger.incoming.error "[Stack:]"
		logger.incoming.error e.stack.replace(/^/gm, '  ')
		throw RocketChat.API.v1.failure 'error-evaluating-script'

	if not sandboxItems.sandbox.Script?
		logger.incoming.error '[Class "Script" not in Trigger', integration.name, ']'
		throw RocketChat.API.v1.failure 'class-script-not-found'


Api = new Restivus
	enableCors: true
	apiPath: 'hooks/'
	auth:
		user: ->
			payloadKeys = Object.keys @bodyParams
			payloadIsWrapped = @bodyParams?.payload? and payloadKeys.length == 1

			if payloadIsWrapped and @request.headers['content-type'] is 'application/x-www-form-urlencoded'
				try
					@bodyParams = JSON.parse @bodyParams.payload
				catch e
					return {
						error: {
							statusCode: 400
							body: {
								success: false
								error: e.message
							}
						}
					}

			@integration = RocketChat.models.Integrations.findOne
				_id: @request.params.integrationId
				token: decodeURIComponent @request.params.token

			if not @integration?
				logger.incoming.info "Invalid integration id", @request.params.integrationId, "or token", @request.params.token
				return

			user = RocketChat.models.Users.findOne
				_id: @integration.userId

			return user: user


createIntegration = (options, user) ->
	logger.incoming.info 'Add integration', options.name
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


executeIntegrationRest = ->
	logger.incoming.info 'Post integration:', @integration.name
	logger.incoming.debug '@urlParams:', @urlParams
	logger.incoming.debug '@bodyParams:', @bodyParams

	if @integration.enabled isnt true
		return {} =
			statusCode: 503
			body: 'Service Unavailable'

	defaultValues =
		channel: @integration.channel
		alias: @integration.alias
		avatar: @integration.avatar
		emoji: @integration.emoji

	if @integration.scriptEnabled is true and @integration.scriptCompiled? and @integration.scriptCompiled.trim() isnt ''
		script = undefined
		try
			script = getIntegrationScript(@integration)
		catch e
			logger.incoming.warn e
			return RocketChat.API.v1.failure e.message

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
			content_raw: @request._readableState?.buffer?.toString()
			headers: @request.headers
			user:
				_id: @user._id
				name: @user.name
				username: @user.username

		try
			sandboxItems = buildSandbox(compiledScripts[@integration._id].store)
			sandbox = sandboxItems.sandbox
			sandbox.script = script
			sandbox.request = request

			result = vm.runInNewContext('script.process_incoming_request({ request: request })', sandbox, { timeout: 3000 })

			if result?.error?
				return RocketChat.API.v1.failure result.error

			@bodyParams = result?.content

			logger.incoming.debug '[Process Incoming Request result of Trigger', @integration.name, ':]'
			logger.incoming.debug 'result', @bodyParams
		catch e
			logger.incoming.error '[Error running Script in Trigger', @integration.name, ':]'
			logger.incoming.error @integration.scriptCompiled.replace(/^/gm, '  ')
			logger.incoming.error "[Stack:]"
			logger.incoming.error e.stack.replace(/^/gm, '  ')
			return RocketChat.API.v1.failure 'error-running-script'

	if not @bodyParams?
		return RocketChat.API.v1.failure 'body-empty'

	@bodyParams.bot =
		i: @integration._id

	try
		message = processWebhookMessage @bodyParams, @user, defaultValues

		if _.isEmpty message
			return RocketChat.API.v1.failure 'unknown-error'

		return RocketChat.API.v1.success()
	catch e
		return RocketChat.API.v1.failure e.error


addIntegrationRest = ->
	return createIntegration @bodyParams, @user


removeIntegrationRest = ->
	return removeIntegration @bodyParams, @user


integrationSampleRest = ->
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


integrationInfoRest = ->
	logger.incoming.info 'Info integration'

	return {} =
		statusCode: 200
		body:
			success: true

Api.addRoute ':integrationId/:userId/:token', authRequired: true, {post: executeIntegrationRest, get: executeIntegrationRest}
Api.addRoute ':integrationId/:token', authRequired: true, {post: executeIntegrationRest, get: executeIntegrationRest}

Api.addRoute 'sample/:integrationId/:userId/:token', authRequired: true, {get: integrationSampleRest}
Api.addRoute 'sample/:integrationId/:token', authRequired: true, {get: integrationSampleRest}

Api.addRoute 'info/:integrationId/:userId/:token', authRequired: true, {get: integrationInfoRest}
Api.addRoute 'info/:integrationId/:token', authRequired: true, {get: integrationInfoRest}

Api.addRoute 'add/:integrationId/:userId/:token', authRequired: true, {post: addIntegrationRest}
Api.addRoute 'add/:integrationId/:token', authRequired: true, {post: addIntegrationRest}

Api.addRoute 'remove/:integrationId/:userId/:token', authRequired: true, {post: removeIntegrationRest}
Api.addRoute 'remove/:integrationId/:token', authRequired: true, {post: removeIntegrationRest}
