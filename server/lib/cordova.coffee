Meteor.methods
	log: ->
		console.log.apply console, arguments

Meteor.startup ->

	Push.debug = RocketChat.settings.get 'Push_debug'

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

		Push.Configure
			apn: apn
			gcm: gcm
			production: RocketChat.settings.get 'Push_production'
			sendInterval: 1000
			sendBatchSize: 10

		if RocketChat.settings.get('Push_enable_gateway') is true
			pushGetway = undefined

			Push.serverSend = (options) ->
				options = options or { badge: 0 }
				query = undefined

				if options.from isnt ''+options.from
					throw new Error('Push.send: option "from" not a string')

				if options.title isnt ''+options.title
					throw new Error('Push.send: option "title" not a string')

				if options.text isnt ''+options.text
					throw new Error('Push.send: option "text" not a string')

				if Push.debug
					console.log('Push: Send message "' + options.title + '" via query', options.query)

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
					if Push.debug
						console.log('send to token', app.token)

					if app.token.apn?
						pushGetway.call 'sendPushNotification', 'apn', app.token.apn, options

					else if app.token.gcm?
						pushGetway.call 'sendPushNotification', 'gcm', app.token.gcm, options

			pushGetway = DDP.connect(RocketChat.settings.get('Push_gateway'), {_dontPrintErrors: false})

		Push.enabled = true
