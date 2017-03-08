import toastr from 'toastr';

Template.AssistifyCreateChannel.helpers({});

Template.AssistifyCreateChannel.events({
	'keydown #request-name': function (e, instance) {
		if ($(e.currentTarget).val().trim() != '' && e.keyCode == 13) {
			instance.$('.save-request').click();
			SideNav.closeFlex(()=>{instance.clearForm()});
		}
	},

	'click .cancel-request': function (event, instance) {
		SideNav.closeFlex(()=>{instance.clearForm()});
	},

	'click .save-request': function (event, instance) {
		event.preventDefault();
		const name = instance.find('#request-name').value.toLowerCase().trim();
		instance.requestRoomName.set(name);

		if(name){
			Meteor.call('createRequest', name, (err, result) => {
				if (err) {
					console.log(err);
					switch (err.error) {
						case 'error-invalid-name':
							toastr.error(TAPi18n.__('Invalid_room_name', name));
							return;
						case 'error-duplicate-channel-name':
							toastr.error(TAPi18n.__('Duplicate_channel_name', name));
							return;
						case 'error-archived-duplicate-name':
							toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
							return;
						default:
							return handleError(err)
					}
				}

				// we're done, so close side navigation and navigate to created request-channel
				SideNav.closeFlex(()=>{instance.clearForm()});
				RocketChat.callbacks.run('aftercreateCombined', { _id: result.rid, name: name });
				FlowRouter.go('request', { name: name }, FlowRouter.current().queryParams);
			});
		} else {
			console.log(err);
			toastr.error(TAPi18n.__('The_field_is_required', TAPi18n.__('request-name')));
		}
	}
});

Template.AssistifyCreateChannel.onCreated(function () {
	instance = this;
	instance.requestRoomName = new ReactiveVar('');

	instance.clearForm = function () {
		instance.requestRoomName.set('');
		instance.find('#request-name').value = '';
	};


});
