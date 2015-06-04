Meteor.startup ->
	Meteor.defer ->
		if ChatRoom.find('57om6EQCcFami9wuT').count() is 0
			ChatRoom.insert
				_id: '57om6EQCcFami9wuT'
				usernames: []
				ts: new Date()
				t: 'c'
				name: 'general'
				msgs: 0
