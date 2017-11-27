import toastr from 'toastr';

Template.forwardMessage.helpers({
	selected() {
		return Template.instance().forwardRoomsList;
	},
	forwardDisabled() {
		return Template.instance().forwardDisabled.get() ? 'disabled' : '';
	}
});

Template.forwardMessage.onCreated(function() {
	this.data.message = ChatMessage.findOne(FlowRouter.getQueryParam('id'));
	this.forwardRoomsList = [];
	this.forwardDisabled = new ReactiveVar(true);
});

Template.forwardMessage.events({
	'change .rc-switch__input'(event, instance) {
		if (event.target.checked) {
			instance.forwardRoomsList.push(event.target.name);
		} else {
			instance.forwardRoomsList = instance.forwardRoomsList.filter(rid => rid !== event.target.name);
		}

		instance.forwardDisabled.set(instance.forwardRoomsList.length === 0);
	},

	'submit .forward-message__content'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		if (instance.forwardRoomsList.length > 0) {
			instance.forwardRoomsList.forEach(rid => {
				Meteor.call('sendMessage', {
					_id: Random.id(),
					rid,
					msg: instance.data.message.msg
				});
			});

			toastr.success(TAPi18n.__('Message_Has_Been_Forward'));

			history.back();
		} else {
			toastr.error(TAPi18n.__('Forward_Has_Empty_Destination'));
		}
	}
});
