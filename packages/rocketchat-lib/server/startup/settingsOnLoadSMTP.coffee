buildMailURL = _.debounce ->
	console.log 'Updating process.env.MAIL_URL'
	if RocketChat.settings.get('SMTP_Host')
		process.env.MAIL_URL = "smtp://"
		if RocketChat.settings.get('SMTP_Username') and RocketChat.settings.get('SMTP_Password')
			process.env.MAIL_URL += encodeURIComponent(RocketChat.settings.get('SMTP_Username')) + ':' + encodeURIComponent(RocketChat.settings.get('SMTP_Password')) + '@'
		process.env.MAIL_URL += encodeURIComponent(RocketChat.settings.get('SMTP_Host'))
		if RocketChat.settings.get('SMTP_Port')
			process.env.MAIL_URL += ':' + parseInt(RocketChat.settings.get('SMTP_Port'))
, 500

RocketChat.settings.onload 'SMTP_Host', (key, value, initialLoad) ->
	if _.isString value
		buildMailURL()

RocketChat.settings.onload 'SMTP_Port', (key, value, initialLoad) ->
	buildMailURL()

RocketChat.settings.onload 'SMTP_Username', (key, value, initialLoad) ->
	if _.isString value
		buildMailURL()

RocketChat.settings.onload 'SMTP_Password', (key, value, initialLoad) ->
	if _.isString value
		buildMailURL()

Meteor.startup ->
	buildMailURL()
