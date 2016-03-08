vm = Npm.require('vm')

triggers = {}

executeScript = (scriptContent, name, sandbox) ->
	script = undefined
	vmScript = undefined
	try
		script = "result = (function() {\n"+scriptContent+"\n}());"
		vmScript = vm.createScript script, 'script.js'
		logger.outgoing.info 'will execute script ' + name
		logger.outgoing.debug script
		logger.outgoing.debug 'with context', sandbox
	catch e
		logger.outgoing.error "[Error evaluating Script:]"
		logger.outgoing.error script.replace(/^/gm, '  ')
		logger.outgoing.error "\n[Stack:]"
		logger.outgoing.error e.stack.replace(/^/gm, '  ')
		return

	try
		sandbox._ = _
		sandbox.s = s
		sandbox.console = console
		sandbox.HTTP = (method, url, options) ->
			try
				return {} =
					result: HTTP.call method, url, options
			catch e
				return {} =
					error: e


		vmScript.runInNewContext sandbox
		logger.outgoing.debug 'result', sandbox.result
		return sandbox.result
	catch e
		logger.outgoing.error "[Error running Script:]"
		logger.outgoing.error script.replace(/^/gm, '  ')
		logger.outgoing.error "\n[Stack:]"
		logger.outgoing.error e.stack.replace(/^/gm, '  ')
		return


RocketChat.models.Integrations.find({type: 'webhook-outgoing'}).observe
	added: (record) ->
		channel = record.channel or '__any'
		triggers[channel] ?= {}
		triggers[channel][record._id] = record

	changed: (record) ->
		channel = record.channel or '__any'
		triggers[channel] ?= {}
		triggers[channel][record._id] = record

	removed: (record) ->
		channel = record.channel or '__any'
		delete triggers[channel][record._id]


ExecuteTriggerUrl = (url, trigger, message, room, tries=0) ->
	word = undefined
	if trigger.triggerWords?.length > 0
		for triggerWord in trigger.triggerWords
			if message.msg.indexOf(triggerWord) is 0
				word = triggerWord
				break

		# Stop if there are triggerWords but none match
		if not word?
			return

	data =
		token: trigger.token
		channel_id: room._id
		channel_name: room.name
		timestamp: message.ts
		user_id: message.u._id
		user_name: message.u.username
		text: message.msg

	if word?
		data.trigger_word = word

	sendMessage = (message) ->
		user = RocketChat.models.Users.findOneByUsername(trigger.username)

		message.bot =
			i: trigger._id

		defaultValues =
			alias: trigger.alias
			avatar: trigger.avatar
			emoji: trigger.emoji

		if room.t is 'd'
			defaultValues.channel = '@'+room._id
		else
			defaultValues.channel = '#'+room._id

		message = processWebhookMessage message, user, defaultValues


	opts =
		params: {}
		method: 'POST'
		url: url
		data: data
		auth: undefined
		npmRequestOptions:
			rejectUnauthorized: !RocketChat.settings.get 'Allow_Invalid_SelfSigned_Certs'
			strictSSL: !RocketChat.settings.get 'Allow_Invalid_SelfSigned_Certs'
		headers:
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'

	if trigger.prepareOutgoingRequestScript? and trigger.prepareOutgoingRequestScript.trim() isnt ''
		trigger.store ?= {}
		sandbox =
			request: opts
			store: trigger.store

		opts = executeScript trigger.prepareOutgoingRequestScript, 'prepareOutgoingRequestScript', sandbox

	if not opts?
		return

	if opts.message?
		sendMessage opts.message

	if not opts.url? or not opts.method?
		return

	HTTP.call opts.method, opts.url, opts, (error, result) ->
		scriptResult = undefined
		if trigger.processOutgoingResponseScript? and trigger.processOutgoingResponseScript.trim() isnt ''
			sandbox =
				request: opts
				response:
					error: error
					status_code: result.statusCode
					content: result.data
					content_raw: result.content
					headers: result.headers
				store: trigger.store

			scriptResult = executeScript trigger.processOutgoingResponseScript, 'processOutgoingResponseScript', sandbox

			if scriptResult?.content
				sendMessage scriptResult.content
				return

			if scriptResult is false
				return

		if not result? or result.statusCode not in [200, 201, 202]
			if error?
				logger.outgoing.error error
			if result?
				logger.outgoing.error result

			if result.statusCode is 410
				RocketChat.models.Integrations.remove _id: trigger._id
				return

			if result.statusCode is 500
				logger.outgoing.error 'Request Error [500]', url
				logger.outgoing.error result.content
				return

			if tries <= 6
				# Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s and 27h46m40s
				Meteor.setTimeout ->
					ExecuteTriggerUrl url, trigger, message, room, tries+1
				, Math.pow(10, tries+2)

			return

		# process outgoing webhook response as a new message
		if result?.statusCode in [200, 201, 202]
			if result?.data?.text? or result?.data?.attachments?
				sendMessage result.data


ExecuteTrigger = (trigger, message, room) ->
	for url in trigger.urls
		ExecuteTriggerUrl url, trigger, message, room


ExecuteTriggers = (message, room) ->
	if not room?
		return

	triggersToExecute = []

	switch room.t
		when 'd'
			id = room._id.replace(message.u._id, '')

			username = _.without room.usernames, message.u.username
			username = username[0]

			if triggers['@'+id]?
				triggersToExecute.push trigger for key, trigger of triggers['@'+id]

			if id isnt username and triggers['@'+username]?
				triggersToExecute.push trigger for key, trigger of triggers['@'+username]

		when 'c'
			if triggers.__any?
				triggersToExecute.push trigger for key, trigger of triggers.__any

			if triggers['#'+room._id]?
				triggersToExecute.push trigger for key, trigger of triggers['#'+room._id]

			if room._id isnt room.name and triggers['#'+room.name]?
				triggersToExecute.push trigger for key, trigger of triggers['#'+room.name]

		else
			if triggers['#'+room._id]?
				triggersToExecute.push trigger for key, trigger of triggers['#'+room._id]

			if room._id isnt room.name and triggers['#'+room.name]?
				triggersToExecute.push trigger for key, trigger of triggers['#'+room.name]


	for triggerToExecute in triggersToExecute
		ExecuteTrigger triggerToExecute, message, room

	return message


RocketChat.callbacks.add 'afterSaveMessage', ExecuteTriggers, RocketChat.callbacks.priority.LOW
