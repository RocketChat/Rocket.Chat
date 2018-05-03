Meteor.startup(function() {
	ChatRoom.find().observe({
		added(data) {
			Session.set(`roomData${ data._id }`, data);
		},
		changed(data) {
			Session.set(`roomData${ data._id }`, data);
		},
		removed(data) {
			Session.set(`roomData${ data._id }`, undefined);
		}
	});
});
