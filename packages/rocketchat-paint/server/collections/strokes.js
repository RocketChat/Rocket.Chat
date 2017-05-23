// Permissions
//================================================================================


Strokes.allow({

	insert: function (userId, doc) {
		return false;
	},

	update: function (userId, doc, fields, modifier) {
		return false;
	},

	remove: function (userId, doc) {
		return false;
	},

});


// Publications
//================================================================================

// TODO: pagination
Meteor.publish('strokes', function (roomId) {
	//Meteor._sleepForMs(500); // useful for testing the loading indicator
	//console.log('strokes publish roomid: ' + roomId);
	check(roomId, String);
	if (!this.userId) {
		return [];
	}
	return Strokes.find({roomId: roomId});
});

