/*
 title
 roomId
 boardId

 time
 userId

 likes

 REMOVED
 --data--

 */

Images = new Meteor.Collection('images');


Images.before.insert(function (userId, doc) {

	if (!userId) return false;

	_.extend(doc, {
		time: (Meteor.isServer) ? new Date() : new Date(TimeSync.serverTime()),
		userId: userId,
		likes: 0,
	});

});


