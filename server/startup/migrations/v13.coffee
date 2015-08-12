Meteor.startup ->
	Migrations.add
		version: 13
		up: ->
			# Set all current users as active
			Meteor.users.update {}, { $set: { active: true } }, { multi: true }
			console.log "Set all users as active"