Meteor.methods
	log: ->
		console.log.apply console, arguments

Meteor.startup ->

	Push.debug = RocketChat.settings.get 'Push_debug'

	if RocketChat.settings.get('Push_enable') is true
		Push.enabled = true
		Push.allow
			send: (userId, notification) ->
				return Meteor.users.findOne({_id: userId})?.admin is true

		Push.Configure
			apn:
				passphrase: RocketChat.settings.get 'Push_apn_passphrase'
				keyData: RocketChat.settings.get 'Push_apn_key'
				certData: RocketChat.settings.get 'Push_apn_cert'
			'apn-dev':
				passphrase: RocketChat.settings.get 'Push_apn_dev_passphrase'
				keyData: RocketChat.settings.get 'Push_apn_dev_key'
				certData: RocketChat.settings.get 'Push_apn_dev_cert'
				gateway: 'gateway.sandbox.push.apple.com'
			production: RocketChat.settings.get 'Push_production'
			badge: true
			sound: true
			alert: true
			vibrate: true
			sendInterval: 1000
			sendBatchSize: 10
