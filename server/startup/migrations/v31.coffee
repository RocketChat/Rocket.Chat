RocketChat.Migrations.add
	version: 31
	up: ->
		changes =
			API_Analytics: 'GoogleTagManager_id'

		for from, to of changes
			record = RocketChat.models.Settings.findOne _id: from
			if record?
				delete record._id
				RocketChat.models.Settings.upsert {_id: to}, record
			RocketChat.models.Settings.remove _id: from
