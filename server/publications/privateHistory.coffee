Meteor.publish 'privateHistory', ->
	unless this.userId
		return this.ready()

	console.log '[publish] privateHistory'.green

	ChatRoom.find
		usernames: Meteor.users.findOne(this.userId).username
	,
		fields:
			t: 1
			name: 1
			msgs: 1
			ts: 1
			lm: 1
			cl: 1

