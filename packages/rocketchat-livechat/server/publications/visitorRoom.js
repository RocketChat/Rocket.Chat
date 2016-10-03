Meteor.publish('livechat:visitorRoom', function(visitorToken, roomId) {
	return RocketChat.models.Rooms.find({		
		'v.token': visitorToken,
		_id: roomId
	},  { 
		fields: { 
			_id: 1, 
			state: 1
		} 
	});
	this.ready();
});