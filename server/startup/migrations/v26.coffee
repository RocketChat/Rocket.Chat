RocketChat.Migrations.add
	version: 26
	up: ->
		RocketChat.models.Messages.update({ t: 'rm' }, { $set: { mentions: [] } }, { multi: true })
