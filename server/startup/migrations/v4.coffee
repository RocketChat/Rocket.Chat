# Meteor.startup ->
# 	Migrations.add
# 		version: 4
# 		up: ->

	try ChatMessage._dropIndex 'rid_1'
	try ChatSubscription._dropIndex 'u._id_1'


	console.log 'Fixing ChatSubscription uid'
	ChatSubscription.update({rn: {$exists: true}}, {$rename: {rn: 'name'}}, {multi: true})

	ChatRoom.find({name: ''}).forEach (item) ->
		name = Random.id().toLowerCase()
		ChatRoom.update item._id, {$set: {name: name}}
		ChatSubscription.update {rid: item._id}, {$set: {name: name}}, {multi: true}

	ChatRoom.find().forEach (room) ->
		ChatRoom.find({name: room.name, _id: {$ne: room._id}}).forEach (item) ->
			name = room.name + '-' + Random.id(2).toLowerCase()
			ChatRoom.update item._id, {$set: {name: name}}
			ChatSubscription.update {rid: item._id}, {$set: {name: name}}, {multi: true}

	ChatRoom.find({msgs: {'$lt': 10}}).forEach (room) ->
		ChatRoom.remove room._id
		ChatMessage.remove {rid: room._id}
		ChatSubscription.remove {rid: room._id}

	# ChatSubscription.find().forEach (item) ->
	# 	ChatSubscription.find({'u._id': item.u._id, name: item.name, t: item.t, _id: {$ne: item._id}}).forEach (subItem) ->
	# 		ChatSubscription.remove subItem._id

	console.log 'End'
