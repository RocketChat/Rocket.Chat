import toastr from 'toastr';

Meteor.startup(function() {
	Tracker.autorun(function() {
		const rid = Session.get('openedRoom');
		if (!rid) {
			return;
		}

		const sub = RocketChat.models.Subscriptions.findOne({ rid, open: true });
		if (sub) {
			return;
		}

		Meteor.call('livechat:getClosedRoomData', rid, (error, result) => {
			if (error) {
				return toastr.error(t(error.error));
			}

			if (result && result.closer && result.closer === 'visitor') {
				toastr.success(t('The_conversation_was_closed_by_the_visitor'));
			}
		});

		Session.delete('openedRoom');
		FlowRouter.go('home');
	});
});
