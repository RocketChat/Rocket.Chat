vm = Npm.require('vm')

triggers = {}

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
		sandbox =
			request: opts

		script = undefined
		vmScript = undefined
		try
			script = "result = (function() {\n"+trigger.prepareOutgoingRequestScript+"\n}());"
			vmScript = vm.createScript script, 'script.js'
			console.log vmScript
			console.log 'will execute script', script
			console.log 'with context', sandbox
		catch e
			console.error "[Error evaluating Script:]"
			console.error script.replace(/^/gm, '  ')
			console.error "\n[Stack:]"
			console.error e.stack.replace(/^/gm, '  ')
			return

		try
			vmScript.runInNewContext sandbox
			opts = sandbox.result
			console.log 'result', opts
			if opts.message?
				return sendMessage opts.message
		catch e
			console.error "[Error running Script:]"
			console.error script.replace(/^/gm, '  ')
			console.error "\n[Stack:]"
			console.error e.stack.replace(/^/gm, '  ')
			return

	if not opts?
		return


	HTTP.call opts.method, opts.url, opts, (error, result) ->
		if not result? or result.statusCode isnt 200
			if error?
				console.error error
			if result?
				console.log result

			if result.statusCode is 410
				RocketChat.models.Integrations.remove _id: trigger._id
				return

			if result.statusCode is 500
				console.log 'Request Error [500]', url
				console.log result.content
				return

			if tries <= 6
				# Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s and 27h46m40s
				Meteor.setTimeout ->
					ExecuteTriggerUrl url, trigger, message, room, tries+1
				, Math.pow(10, tries+2)
			return

		# process outgoing webhook response as a new message
		else if result?.statusCode is 200
			if trigger.processOutgoingResponseScript? and trigger.processOutgoingResponseScript.trim() isnt ''
				sandbox =
					request: opts
					response:
						content: result.data
						content_raw: result.content
						headers: result.headers

				script = undefined
				vmScript = undefined
				try
					script = "result = (function() {\n"+trigger.processOutgoingResponseScript+"\n}());"
					vmScript = vm.createScript script, 'script.js'
					console.log vmScript
					console.log 'will execute script', script
					console.log 'with context', sandbox
				catch e
					console.error "[Error evaluating Script:]"
					console.error script.replace(/^/gm, '  ')
					console.error "\n[Stack:]"
					console.error e.stack.replace(/^/gm, '  ')
					return

				try
					vmScript.runInNewContext sandbox
					result = sandbox.result.content
					if result?
						result = data: result
					console.log 'result', result
				catch e
					console.error "[Error running Script:]"
					console.error script.replace(/^/gm, '  ')
					console.error "\n[Stack:]"
					console.error e.stack.replace(/^/gm, '  ')
					return RocketChat.API.v1.failure 'error-running-script'


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
