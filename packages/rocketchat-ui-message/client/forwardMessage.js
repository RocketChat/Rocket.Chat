Template.forwardMessage.helpers({
	users() {
		return RocketChat.models.Users.find({
			// TODO: #396
		});
	},
	channels() {
		return RocketChat.models.Subscriptions.find({
			// TODO: #396
		});
	},
	forwardIsDisabled() {
		// TODO: #396
	}
});

Template.forwardMessage.onCreated(function() {
	this.data.message = ChatMessage.findOne(FlowRouter.getQueryParam('id'));
});

Template.forwardMessage.events({
	// TODO: #396
	// toastr.success(TAPi18n.__('Forwarded'));
});
