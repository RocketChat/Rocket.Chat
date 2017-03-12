import toastr from 'toastr';

Template.AssistifyCreateExpertise.helpers({
	selectedUsers: function(){
		const instance = Template.instance();
		return instance.selectedUsers.get();
	},
	autocompleteSettings: function() {
		return {
			limit: 10,
			// inputDelay: 300
			rules: [
				{
					// @TODO maybe change this 'collection' and/or template
					collection: 'UserAndRoom',
					subscription: 'userAutocomplete',
					field: 'username',
					template: Template.userSearch,
					noMatchTemplate: Template.userSearchEmpty,
					matchAll: true,
					filter: {
						exceptions: Template.instance().selectedUsers.get()
					},
					selector(match) {
						return { term: match };
					},
					sort: 'username'
				}
			]
		};
	}
});

Template.AssistifyCreateExpertise.events({
	'autocompleteselect #experts'(event, instance, doc) {
		instance.selectedUsers.set(instance.selectedUsers.get().concat(doc.username));

		instance.selectedUserNames[doc.username] = doc.name;

		event.currentTarget.value = '';
		return event.currentTarget.focus();
	},

	'click .remove-expert'(e, instance) {
		let self = this;

		let users = Template.instance().selectedUsers.get();
		users = _.reject(Template.instance().selectedUsers.get(), _id => _id === self.valueOf());

		Template.instance().selectedUsers.set(users);

		return $('#experts').focus();
	},


	'keyup #expertise': function(e, instance) {
		if (e.keyCode == 13) {
			instance.$('#experts').focus();
		}
	},

	'keydown #channel-members'(e, instance) {
		if (($(e.currentTarget).val() === '') && (e.keyCode === 13)) {
			return instance.$('.save-channel').click();
		}
	},

	'click .cancel-expertise': function (event, instance) {
		SideNav.closeFlex(()=>{instance.clearForm()});
	},

	'click .save-expertise': function (event, instance) {
		event.preventDefault();
		const name = instance.find('#expertise').value.toLowerCase().trim();
		instance.expertiseRoomName.set(name);

		if(name){
			Meteor.call('createExpertise', name, instance.selectedUsers.get(), (err, result) => {
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
						case 'error-no-members':
							toastr.error(TAPi18n.__('Expertise_needs_experts', name));
							return;
						default:
							return handleError(err)
					}
				}

				// we're done, so close side navigation and navigate to created request-channel
				SideNav.closeFlex(()=>{instance.clearForm()});
				RocketChat.callbacks.run('aftercreateCombined', { _id: result.rid, name: name });
				FlowRouter.go('expertise', { name: name }, FlowRouter.current().queryParams);
			});
		} else {
			console.log(err);
			toastr.error(TAPi18n.__('The_field_is_required', TAPi18n.__('expertise')));
		}
	}
});

Template.AssistifyCreateExpertise.onCreated(function () {
	const instance = this;
	instance.expertiseRoomName = new ReactiveVar('');
	instance.selectedUsers = new ReactiveVar([]);
	instance.selectedUserNames = {};

	instance.clearForm = function () {
		instance.expertiseRoomName.set('');
		instance.selectedUsers.set([]);
		instance.find('#expertise').value = '';
		instance.find('#experts').value = '';
	};
});
