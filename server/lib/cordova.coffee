Meteor.methods
	log: ->
		console.log.apply console, arguments

Meteor.startup ->
	Push.debug = true

	Push.Configure
		apn:
			passphrase: '***'
			keyData: Assets.getText 'certs/PushRocketChatKey.pem'
			certData: Assets.getText 'certs/PushRocketChatCert_development.pem'
			gateway: 'gateway.sandbox.push.apple.com'
		'apn-dev':
			passphrase: '***'
			keyData: Assets.getText 'certs/PushRocketChatKey.pem'
			certData: Assets.getText 'certs/PushRocketChatCert_development.pem'
			gateway: 'gateway.sandbox.push.apple.com'
		production: false
		badge: true
		sound: true
		alert: true
		vibrate: true
