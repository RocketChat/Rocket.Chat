Meteor.methods
	log: ->
		console.log.apply console, arguments

	push_test: ->
		user = Meteor.user()
		if not user?
			throw new Meteor.Error 'unauthorized', '[methods] push_test -> Unauthorized'

		if not RocketChat.authz.hasRole(user._id, 'admin')
			throw new Meteor.Error 'unauthorized', '[methods] push_test -> Unauthorized'

		if Push.enabled isnt true
			throw new Meteor.Error 'push_disabled'

		query =
			$and: [
				userId: user._id
				{
					$or: [
						{ 'token.apn': { $exists: true } }
						{ 'token.gcm': { $exists: true } }
					]
				}
			]

		tokens = Push.appCollection.find(query).count()

		if tokens is 0
			throw new Meteor.Error 'no_tokens_for_this_user'

		Push.send
			from: 'push'
			title: "@#{user.username}"
			text: TAPi18n.__ "This_is_a_push_test_messsage"
			apn:
				text: "@#{user.username}:\n" + TAPi18n.__ "This_is_a_push_test_messsage"
			sound: 'chime'
			query:
				userId: user._id

		return {} =
			message: "Your_push_was_sent_to_s_devices"
			params: [tokens]


configurePush = ->
	if RocketChat.settings.get 'Push_debug'
		console.log 'Push: configuring...'

	if RocketChat.settings.get('Push_enable') is true
		Push.allow
			send: (userId, notification) ->
				return RocketChat.authz.hasRole(userId, 'admin')

		apn = undefined
		gcm = undefined

		if RocketChat.settings.get('Push_enable_gateway') is false
			gcm =
				apiKey: RocketChat.settings.get 'Push_gcm_api_key'
				projectNumber: RocketChat.settings.get 'Push_gcm_project_number'

			apn =
				passphrase: RocketChat.settings.get 'Push_apn_passphrase'
				keyData: RocketChat.settings.get 'Push_apn_key'
				certData: RocketChat.settings.get 'Push_apn_cert'

			if RocketChat.settings.get('Push_production') isnt true
				apn =
					passphrase: RocketChat.settings.get 'Push_apn_dev_passphrase'
					keyData: RocketChat.settings.get 'Push_apn_dev_key'
					certData: RocketChat.settings.get 'Push_apn_dev_cert'
					gateway: 'gateway.sandbox.push.apple.com'

			if not apn.keyData? or apn.keyData.trim() is '' or not apn.keyData? or apn.keyData.trim() is ''
				apn = undefined

			if not gcm.apiKey? or gcm.apiKey.trim() is '' or not gcm.projectNumber? or gcm.projectNumber.trim() is ''
				gcm = undefined

		Push.Configure
			apn: apn
			gcm: gcm
			production: RocketChat.settings.get 'Push_production'
			sendInterval: 1000
			sendBatchSize: 10

		if RocketChat.settings.get('Push_enable_gateway') is true
			Push.serverSend = (options) ->
				options = options or { badge: 0 }
				query = undefined

				if options.from isnt ''+options.from
					throw new Error('Push.send: option "from" not a string')

				if options.title isnt ''+options.title
					throw new Error('Push.send: option "title" not a string')

				if options.text isnt ''+options.text
					throw new Error('Push.send: option "text" not a string')

				if RocketChat.settings.get 'Push_debug'
					console.log('Push: send message "' + options.title + '" via query', options.query)

				query =
					$and: [
						options.query
						{
							$or: [
								{ 'token.apn': { $exists: true } }
								{ 'token.gcm': { $exists: true } }
							]
						}
					]

				Push.appCollection.find(query).forEach (app) ->
					if RocketChat.settings.get 'Push_debug'
						console.log('Push: send to token', app.token)

					if app.token.apn?
						service = 'apn'
						token = app.token.apn
					else if app.token.gcm?
						service = 'gcm'
						token = app.token.gcm

					sendPush service, token, options

		Push.enabled = true

sendPush = (service, token, options, tries=0) ->
	try
		HTTP.post RocketChat.settings.get('Push_gateway') + "/push/#{service}/send",
			data:
				token: token
				options: options
	catch e
		SystemLogger.error 'Error sending push to gateway ('+tries+' try) ->', e
		if tries <= 6
			milli = Math.pow(10, tries+2)

			SystemLogger.log 'Trying sending push to gateway again in', milli, 'milliseconds'

			# Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s and 27h46m40s
			Meteor.setTimeout ->
				sendPush service, token, options, tries+1
			, milli

Meteor.startup ->
	configurePush()

	## Prepared to reconfigure the push plugin
	#
	# keys = [
	# 	'Push_enable'
	# 	'Push_enable_gateway'
	# 	'Push_gcm_api_key'
	# 	'Push_gcm_project_number'
	# 	'Push_apn_passphrase'
	# 	'Push_apn_key'
	# 	'Push_apn_cert'
	# 	'Push_production'
	# 	'Push_apn_dev_passphrase'
	# 	'Push_apn_dev_key'
	# 	'Push_apn_dev_cert'
	# 	'Push_gateway'
	# ]

	# configurePushDebounce = _.debounce Meteor.bindEnvironment(configurePush), 1000

	# RocketChat.settings.onload keys, ->
	# 	configurePushDebounce()

