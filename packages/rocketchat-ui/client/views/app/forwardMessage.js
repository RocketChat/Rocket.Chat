Template.forwardMessage.helpers({
	subscriptions() {
		return RocketChat.models.Subscriptions.find({
			'u._id': Meteor.userId(),
			open: true
		}, {
			fields: {
				rid: 1,
				name: 1,
				t: 1
			},
			sort: {
				name: 1
			}
		});
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
	selectedChannels() {
		return Template.instance().selectedChannels.get();
	},
	forwardIsDisabled() {
		// TODO: #396
	}
});

Template.forwardMessage.onCreated(function() {
	this.data.message = ChatMessage.findOne(FlowRouter.getQueryParam('id'));

	this.selectedUsers = new ReactiveVar([]);
	this.selectedChannels = new ReactiveVar([]);
});

Template.forwardMessage.events({
	// TODO: #396
	// toastr.success(TAPi18n.__('Forwarded'));
});
