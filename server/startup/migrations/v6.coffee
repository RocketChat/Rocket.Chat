RocketChat.Migrations.add
	version: 6
	up: ->

		console.log 'Changin _id of #general channel room from XXX to GENERAL'
		room = RocketChat.models.Rooms.findOneByName('general')
		if room?._id is not 'GENERAL'
			RocketChat.models.Subscriptions.update({'rid':room._id},{'$set':{'rid':'GENERAL'}},{'multi':1})
			RocketChat.models.Messages.update({'rid':room._id},{'$set':{'rid':'GENERAL'}},{'multi':1})
			RocketChat.models.Rooms.removeById(room._id)
			delete room._id
			RocketChat.models.Rooms.upsert({'_id':'GENERAL'},{$set: room})


		console.log 'End'
