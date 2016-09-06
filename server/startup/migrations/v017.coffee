RocketChat.Migrations.add
	version: 17
	up: ->
		RocketChat.models.Messages.tryDropIndex({ _hidden: 1 })
