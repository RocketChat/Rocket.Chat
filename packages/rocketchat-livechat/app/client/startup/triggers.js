console.log('startup trigger');
Meteor.startup(function() {
	console.log('go');
	Meteor.subscribe('livechat:trigger', function() {
		console.log('ready');
		Triggers.init()
	})
});
