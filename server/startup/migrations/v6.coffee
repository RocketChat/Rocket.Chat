Meteor.startup ->
	Migrations.add
		version: 6
		up: ->

			console.log 'Changin _id of #general channel room from XXX to GENERAL'
			room = ChatRoom.findOne('name':'general')
			if room?._id is not 'GENERAL'
				ChatSubscription.update({'rid':room._id},{'$set':{'rid':'GENERAL'}},{'multi':1})
				ChatMessage.update({'rid':room._id},{'$set':{'rid':'GENERAL'}},{'multi':1})
				ChatRoom.remove({'_id':room._id})
				delete room._id
				ChatRoom.upsert({'_id':'GENERAL'},{$set: room})


			console.log 'End'
