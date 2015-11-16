RocketChat.changeRoomTopic = (rid, roomTopic) ->
	unless Match.test rid, String
		throw new Meteor.Error 'invalid-rid'

	console.log '[function] RocketChat.changeRoomTopic'.green, rid, roomTopic
	return RocketChat.models.Rooms.setTopicById(rid, roomTopic)
