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
	selected() {
		return Template.instance().selectedChannels.get();
	},
	forwardIsDisabled() {
		// TODO: #396
	}
});

Template.forwardMessage.onCreated(function() {
	this.data.message = ChatMessage.findOne(FlowRouter.getQueryParam('id'));

	this.selected =[];
});

Template.forwardMessage.events({
	// TODO: #396
	// toastr.success(TAPi18n.__('Forwarded'));
	'change input[type="checkbox"]'(e, t) {
		if (e.target.checked) {
			t.instance.selected.push(e.target.name);
		} else {
			t.instance.selected = _.without(t.instance.selected, _.findWhere(t.instance.selected, e.target.name));
		}
	}
});
