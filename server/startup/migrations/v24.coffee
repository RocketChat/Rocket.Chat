RocketChat.Migrations.add
	version: 24
	up: ->
		RocketChat.models.Permissions.remove({ _id: 'access-rocket-permissions' })
