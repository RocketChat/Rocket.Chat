Meteor.publish 'visitorRoom', (visitorToken) ->
	return ChatRoom.find
		"v.token": visitorToken
	,
		fields:
			name: 1
			t: 1
			cl: 1
			u: 1
			usernames: 1
			v: 1
