Meteor.publish 'privateHistory', ->
	unless this.userId
		return this.ready()

	RocketChat.models.Rooms.findByContainigUsername RocketChat.models.Users.findOneById(this.userId).username,
		fields:
			t: 1
			name: 1
			msgs: 1
			ts: 1
			lm: 1
			cl: 1

