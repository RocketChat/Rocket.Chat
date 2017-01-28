Images.allow({
	insert: function (userId, doc) {
		// TODO: check room privileges
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
Meteor.publish('images', function () {
	if (!this.userId) {
		return [];
	}
	return Images.find({}, {fields: {data: 0}});
});


