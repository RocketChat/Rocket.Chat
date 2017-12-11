import _ from 'underscore';
import toastr from 'toastr';

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
		return Template.instance().forwardDestinationList;
	},
	forwardIsDisabled() {
		// TODO: #396
	}
});

Template.forwardMessage.onCreated(function() {
	this.data.message = ChatMessage.findOne(FlowRouter.getQueryParam('id'));

	this.forwardDestinationList = [];
});

Template.forwardMessage.events({
	'change .rc-switch__input'(event, instance) {
		if (event.target.checked) {
			instance.forwardDestinationList.push(event.target.name);
		} else {
			instance.forwardDestinationList = _.without(
				instance.forwardDestinationList, _.findWhere(
					instance.forwardDestinationList, event.target.name
				)
			);
		}
		console.log('Selected: ', instance.forwardDestinationList);
	},

	'submit .forward-message__content'(event, instance) {
		event.preventDefault();

		instance.forwardDestinationList.forEach(destination => {
			// TODO: #396
			console.log(destination);

			// Send attached message...
			RocketChat.sendMessage(user, message, room);
		});

		toastr.success(TAPi18n.__('Forwarded'));
	}
});
