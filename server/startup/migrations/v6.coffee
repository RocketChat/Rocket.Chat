Meteor.startup ->
	Migrations.add
		version: 6
		up: ->

			console.log 'Changin _id of #general channel room from 57om6EQCcFami9wuT to GENERAL'
			room = ChatRoom.findOne('57om6EQCcFami9wuT')
			newId = 'GENERAL'
			if room
				ChatSubscription.update({'rid':room._id},{'$set':{'rid':newId}},{'multi':1})
				ChatMessage.update({'rid':room._id},{'$set':{'rid':newId}},{'multi':1})
				ChatRoom.remove({'_id':room._id})
				delete room._id
				ChatRoom.upsert({'_id':newId}, { $set: room})


			console.log 'End'
