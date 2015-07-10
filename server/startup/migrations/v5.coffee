Meteor.startup ->
	Migrations.add
		version: 5
		up: ->

			console.log 'Dropping test rooms with less than 2 messages'
			ChatRoom.find({msgs: {'$lt': 2}}).forEach (room) ->
				console.log 'Dropped: ', room.name
				ChatRoom.remove room._id
				ChatMessage.remove {rid: room._id}
				ChatSubscription.remove {rid: room._id}


			console.log 'Dropping test rooms with less than 2 user'
			ChatRoom.find({usernames: {'$size':1}}).forEach (room) ->
				console.log 'Dropped: ', room.name
				ChatRoom.remove room._id
				ChatMessage.remove {rid: room._id}
				ChatSubscription.remove {rid: room._id}


			console.log 'Adding username to all users'
			Meteor.users.find({ 'username': {'$exists':0}, 'emails': {'$exists':1} }).forEach (user) ->
				newUserName = user.emails[0].address.split("@")[0]
				if Meteor.users.findOne({'username':newUserName})
					newUserName = newUserName + Math.floor((Math.random() * 10) + 1)
					if Meteor.users.findOne({'username':newUserName})
						newUserName = newUserName + Math.floor((Math.random() * 10) + 1)
						if Meteor.users.findOne({'username':newUserName})
							newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
				console.log 'Adding: username ' + newUserName + ' to all user ' + user._id;
				Meteor.users.update({'_id':user._id},{'$set':{'username':newUserName}});


			console.log 'Fixing _id of direct messages rooms'
			ChatRoom.find({'t': 'd'}).forEach (room) ->
				newId = ''
				id0 = Meteor.users.findOne({ 'username': room.usernames[0] })._id
				id1 = Meteor.users.findOne({ 'username': room.usernames[1] })._id
				ids = [id0,id1]
				newId = ids.sort().join('')
				if (newId != room._id)
					console.log 'Fixing: _id ' + room._id + ' to ' + newId
					ChatSubscription.update({'rid':room._id},{'$set':{'rid':newId}},{'multi':1})
					ChatMessage.update({'rid':room._id},{'$set':{'rid':newId}},{'multi':1})
					ChatRoom.remove({'_id':room._id})
					room._id = newId
					ChatRoom.insert(room)
				ChatSubscription.update({'rid':room._id,'u._id':id0},{'$set':{'name':room.usernames[1]}})
				ChatSubscription.update({'rid':room._id,'u._id':id1},{'$set':{'name':room.usernames[0]}})


			console.log 'Adding u.username to all documents'
			Meteor.users.find({},{'username':1}).forEach (user) ->
				console.log 'Adding: u.username ' + user.username + ' to all document'
				ChatRoom.update({'u._id':user._id},{'$set':{'u.username':user.username}},{'multi':1})
				ChatSubscription.update({'u._id':user._id},{'$set':{'u.username':user.username}},{'multi':1})
				ChatMessage.update({'u._id':user._id},{'$set':{'u.username':user.username}},{'multi':1})
				ChatMessage.update({'uid':user._id},{'$set':{'u':user}},{'multi':1})
				ChatMessage.update({'by':user._id},{'$set':{'u':user}},{'multi':1})
				ChatMessage.update({'uid':{'$exists':1}},{'$unset':{'uid':1,'by':1}},{'multi':1})


			console.log 'End'
