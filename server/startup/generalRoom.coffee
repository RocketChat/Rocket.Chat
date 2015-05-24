Meteor.startup ->
	Meteor.defer ->
		if ChatRoom.find('57om6EQCcFami9wuT').count() is 0
			ChatRoom.insert
				_id: '57om6EQCcFami9wuT'
				uids: []
				ts: new Date()
				t: 'g'
				name: '#general'
				msgs: 0
