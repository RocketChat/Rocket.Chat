Likes.allow({
	insert: function (userId, doc) {
		// TODO: check room privileges
		return !!userId;
	},

	update: function (userId, doc, fields, modifier) {
		return false;
	},

	remove: function (userId, doc) {
		return doc.userId === userId;
	},
});


Likes.before.insert(function (userId, doc) {

	if (!userId) return false;

	var like = Likes.findOne({
		userId: userId,
		itemId: doc.itemId,
		itemClass: doc.itemClass,
	});

	if (like) return false;

	_.extend(doc, {
		time: (Meteor.isServer) ? new Date() : new Date(TimeSync.serverTime()),
		userId: userId,
	});

	if (doc.itemClass === 'images') {
		Images.update(doc.itemId, {$inc: {likes: 1}});
	}

});


Likes.before.remove(function (userId, doc) {

	if (!userId) return false;

	if (doc.itemClass === 'images') {
		Images.update(doc.itemId, {$inc: {likes: -1}});
	}

});


Meteor.publish('myLikes', function () {
	if (!this.userId) {
		return [];
	}
	return Likes.find({userId: this.userId});
});


