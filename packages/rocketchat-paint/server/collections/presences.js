var Fiber = Npm.require('fibers');

Meteor.startup(function () {
	Presences.remove({
		createdAt: {$lt: new Date().getTime()}
	});
});


Meteor.publish('presenceLog', function (roomId) {
	check(roomId, String);

	var pid = Presences.insert({
		userId: this.userId,
		roomId: roomId,
		createdAt: new Date().getTime(),
	});

	this.onStop(function () {
		Presences.remove(pid);
	});

	return [];
});


Meteor.publish('presences', function (roomId) {
	check(roomId, String);
	return Presences.find({roomId: roomId});
});


Presences.allow({

	update: function (userId, doc, fields) {
		if (!userId) return false;
		if (userId !== doc.userId) return false;
		if (fields.length > 3) return false;
		//if(!_.contains(fields, 'boardId')) return false;
		if (!_.contains(fields, 'x')) return false;
		if (!_.contains(fields, 'y')) return false;
		return true;
	},

});


