Template.tokenChannelsList.helpers({
	rooms() {
		return Template.instance().tokenlyRooms.get().filter(room => {
			return RocketChat.models.Subscriptions.find({ rid: room._id }).count() === 0;
		});
	}
});

Template.tokenChannelsList.onRendered(function() {
	Tracker.autorun(c => {
		const user = Meteor.user();
		if (user && user.services && user.services.tokenly) {
			c.stop();

			Meteor.call('findTokenChannels', (error, result) => {
				if (!error) {
					this.tokenlyRooms.set(result);
				}
			});
		}
	});
});

Template.tokenChannelsList.onCreated(function() {
	this.tokenlyRooms = new ReactiveVar([]);
});
