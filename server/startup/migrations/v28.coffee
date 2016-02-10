RocketChat.Migrations.add
	version: 28
	up: ->
		RocketChat.models.Permissions.addRole 'view-c-room', 'bot'
