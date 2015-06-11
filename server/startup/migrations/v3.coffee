Meteor.startup ->
	Migrations.add
		version: 3
		up: ->

			try
				ChatSubscription._dropIndex 'uid_1'
			try
				ChatSubscription._dropIndex 'rid_1_uid_1'


			console.log 'Fixing ChatSubscription uid'
			ChatSubscription.find({uid: {$exists: true}}, {nonreactive: true}).forEach (sub) ->
				update = {}
				user = Meteor.users.findOne(sub.uid, {fields: {username: 1}})
				if user?
					update.$set ?= {}
					update.$unset ?= {}
					update.$set['u._id'] = user._id
					update.$set['u.username'] = user.username
					update.$unset.uid = 1

				if Object.keys(update).length > 0
					ChatSubscription.update(sub._id, update)


			console.log 'Fixing ChatRoom uids'
			ChatRoom.find({'uids.0': {$exists: true}}, {nonreactive: true}).forEach (room) ->
				update = {}
				users = Meteor.users.find {_id: {$in: room.uids}, username: {$exists: true}}, {fields: {username: 1}}
				usernames = users.map (user) ->
					return user.username

				update.$set ?= {}
				update.$unset ?= {}
				update.$set.usernames = usernames
				update.$unset.uids = 1

				user = Meteor.users.findOne(room.uid, {fields: {username: 1}})
				if user?
					update.$set['u._id'] = user._id
					update.$set['u.username'] = user.username
					update.$unset.uid = 1

				if room.t is 'd' and usernames.length is 2
					for k, v of update.$set
						room[k] = v
					for k, v of update.$unset
						delete room[k]

					oldId = room._id
					room._id = usernames.sort().join(',')
					ChatRoom.insert(room)
					ChatRoom.remove({_id: oldId})
					ChatSubscription.update({rid: oldId}, {$set: {rid: room._id}}, {multi: true})
					ChatMessage.update({rid: oldId}, {$set: {rid: room._id}}, {multi: true})
				else
					ChatRoom.update(room._id, update)


			console.log 'Fixing ChatMessage uid'
			ChatMessage.find({uid: {$exists: true}}, {nonreactive: true}).forEach (message) ->
				update = {}
				user = Meteor.users.findOne(message.uid, {fields: {username: 1}})
				if user?
					update.$set ?= {}
					update.$unset ?= {}
					update.$set['u._id'] = user._id
					update.$set['u.username'] = user.username
					update.$unset.uid = 1

				if Object.keys(update).length > 0
					ChatMessage.update(message._id, update)

			console.log 'End'
