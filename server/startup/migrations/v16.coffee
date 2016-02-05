RocketChat.Migrations.add
	version: 16
	up: ->
		RocketChat.models.Messages.tryDropIndex({ _hidden: 1 })
