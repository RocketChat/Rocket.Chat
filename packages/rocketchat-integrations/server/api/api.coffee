vm = Npm.require('vm')

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
		console.log 'Post integration'
		console.log '@urlParams', @urlParams
		console.log '@bodyParams', @bodyParams

		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)
		user = RocketChat.models.Users.findOne(@userId)

		defaultValues =
			channel: integration.channel
			alias: integration.alias
			avatar: integration.avatar
			emoji: integration.emoji


		if integration.processIncomingRequestScript? and integration.processIncomingRequestScript.trim() isnt ''
			sandbox =
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

			script = undefined
			vmScript = undefined
			try
				script = "result = (function() {\n"+integration.processIncomingRequestScript+"\n}());"
				vmScript = vm.createScript script, 'script.js'
				console.log vmScript
				console.log 'will execute script', script
				console.log 'with context', sandbox
			catch e
				console.error "[Error evaluating Script:]"
				console.error script.replace(/^/gm, '  ')
				console.error "\n[Stack:]"
				console.error e.stack.replace(/^/gm, '  ')
				return RocketChat.API.v1.failure 'error-evaluating-script'

			try
				vmScript.runInNewContext sandbox
				if sandbox.result.error?
					return RocketChat.API.v1.failure sandbox.result.error

				@bodyParams = sandbox.result?.content
				console.log 'result', @bodyParams
			catch e
				console.error "[Error running Script:]"
				console.error script.replace(/^/gm, '  ')
				console.error "\n[Stack:]"
				console.error e.stack.replace(/^/gm, '  ')
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
	console.log 'Add integration'
	console.log options

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
	console.log 'Remove integration'
	console.log options

	integrationToRemove = RocketChat.models.Integrations.findOne urls: options.target_url
	Meteor.runAsUser user._id, =>
		Meteor.call 'deleteOutgoingIntegration', integrationToRemove._id

	return RocketChat.API.v1.success()


Api.addRoute 'add/:integrationId/:userId/:token', authRequired: true,
	post: ->
		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)

		if not integration?
			return RocketChat.API.v1.failure 'Invalid integraiton id'

		user = RocketChat.models.Users.findOne(@userId)

		return createIntegration @bodyParams, user


Api.addRoute 'remove/:integrationId/:userId/:token', authRequired: true,
	post: ->
		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)

		if not integration?
			return RocketChat.API.v1.failure 'Invalid integraiton id'

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
		console.log 'Sample Integration'

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
		console.log 'Info integration'

		return {} =
			statusCode: 200
			body:
				success: true

