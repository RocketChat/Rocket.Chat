Meteor.startup(function() {
	Meteor.subscribe('livechat:trigger', function() {
		Triggers.init();
	});
});
