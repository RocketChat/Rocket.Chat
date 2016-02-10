RocketChat.Migrations.add
	version: 22
	up: ->
		###
		# Update message edit field
		###

		RocketChat.models.Messages.upgradeEtsToEditAt()
		console.log 'Updated old messages\' ets edited timestamp to new editedAt timestamp.'
