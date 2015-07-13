Meteor.startup ->
	Migrations.add
		version: 4
		up: ->

			try ChatMessage._dropIndex 'rid_1'
			try ChatSubscription._dropIndex 'u._id_1'


			console.log 'Rename rn to name'
			ChatSubscription.update({rn: {$exists: true}}, {$rename: {rn: 'name'}}, {multi: true})


			console.log 'Adding names to rooms without name'
			ChatRoom.find({name: ''}).forEach (item) ->
				name = Random.id().toLowerCase()
				ChatRoom.update item._id, {$set: {name: name}}
				ChatSubscription.update {rid: item._id}, {$set: {name: name}}, {multi: true}


			console.log 'Making room names unique'
			ChatRoom.find().forEach (room) ->
				ChatRoom.find({name: room.name, _id: {$ne: room._id}}).forEach (item) ->
					name = room.name + '-' + Random.id(2).toLowerCase()
					ChatRoom.update item._id, {$set: {name: name}}
					ChatSubscription.update {rid: item._id}, {$set: {name: name}}, {multi: true}


			console.log 'End'
