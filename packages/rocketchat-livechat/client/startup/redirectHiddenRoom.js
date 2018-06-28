import toastr from 'toastr';

Meteor.startup(function() {
	Tracker.autorun(function() {
		const rid = Session.get('openedRoom');
		if (!rid) {
			return;
		}

		const sub = RocketChat.models.Subscriptions.findOne({ rid, open: true });
		if (!sub) {
			toastr.success(t('Conversation_finished'));
			Session.set('openedRoom');
			FlowRouter.go('home');
		}
	});
});
