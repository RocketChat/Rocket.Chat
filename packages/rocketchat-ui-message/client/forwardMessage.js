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
	}
});

Template.forwardMessage.onCreated(function() {
	this._id = FlowRouter.getQueryParam('id');

	this.message = ChatMessage.findOne(this._id, {sort: {ts: 1}});
});

Template.forwardMessage.events({
	// TODO: #396
	// toastr.success(TAPi18n.__('Forwarded'));
});

Template.forwardMessage.helpers({
	getMessage() {
		return Template.instance().message;
	}
});

