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
							instance.error.set({invalid: true});
							return;
						case 'error-duplicate-channel-name':
							instance.error.set({duplicate: true});
							return;
						case 'error-archived-duplicate-name':
							instance.error.set({archivedduplicate: true});
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
			instance.error.set({ fields: ["request-name"] })
		}
	}
});

Template.AssistifyCreateChannel.onCreated(function () {
	instance = this;
	instance.requestRoomName = new ReactiveVar('');
	instance.error = new ReactiveVar([]);

	instance.clearForm = function () {
		instance.error.set([]);
		instance.requestRoomName.set('');
		instance.find('#request-name').value = '';
	};


});
