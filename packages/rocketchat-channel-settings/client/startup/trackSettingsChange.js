/* globals RoomManager */
Meteor.startup(function() {
	let roomSettingsChangedCallback = (msg) => {
		Tracker.nonreactive(() => {
			if (msg.t === 'room_changed_privacy') {
				if (Session.get('openedRoom') === msg.rid) {
					let type = FlowRouter.current().route.name === 'channel' ? 'c' : 'p';
					RoomManager.close(type + FlowRouter.getParam('name'));

					const subscription = ChatSubscription.findOne({ rid: msg.rid });
					let route = subscription.t === 'c' ? 'channel' : 'group';
					FlowRouter.go(route, { name: subscription.name }, FlowRouter.current().queryParams);
				}
			}
		});

		return msg;
	};

	RocketChat.callbacks.add('streamMessage', roomSettingsChangedCallback, RocketChat.callbacks.priority.HIGH, 'room-settings-changed');

	let roomNameChangedCallback = (msg) => {
		Tracker.nonreactive(() => {
			if (msg.t === 'r') {
				if (Session.get('openedRoom') === msg.rid) {
					let type = FlowRouter.current().route.name === 'channel' ? 'c' : 'p';
					RoomManager.close(type + FlowRouter.getParam('name'));
					FlowRouter.go(FlowRouter.current().route.name, { name: msg.msg }, FlowRouter.current().queryParams);
				}
			}
		});

		return msg;
	};

	RocketChat.callbacks.add('streamMessage', roomNameChangedCallback, RocketChat.callbacks.priority.HIGH, 'room-name-changed');
});
