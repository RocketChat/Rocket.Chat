/* globals RocketChat, FlowRouter, console */
import toastr from 'toastr';

Template.AssistifyCreateExpertise.helpers({
	selectedUsers() {
		const instance = Template.instance();
		return instance.selectedUsers.get();
	},
	autocompleteSettings() {
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
						return {term: match};
					},
					sort: 'username'
				}
			]
		};
	},
	canCreateExpertise() {
		// as custom authorization leads to a streamer-exception, it has been disabled.
		// Check whether the user is in the expert's channel as lightweight workaround
		const instance = Template.instance();
		const isExpert = instance.isExpert.get();
		const error = instance.error.get();
		if (!isExpert && error && error.error === 'no-expert-room-defined') {
			toastr.info(TAPi18n.__('no-expert-room-defined'));
			return false;
		}
		return isExpert;
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
		const self = this;

		let users = instance.selectedUsers.get();
		users = _.reject(instance.selectedUsers.get(), _id => _id === self.valueOf());

		instance.selectedUsers.set(users);

		return $('#experts').focus();
	},


	'keyup #expertise'(e, instance) {
		if (e.keyCode === 13) {
			instance.$('#experts').focus();
		}
	},

	'keydown #channel-members'(e, instance) {
		if (($(e.currentTarget).val() === '') && (e.keyCode === 13)) {
			return instance.$('.save-channel').click();
		}
	},

	'click .cancel-expertise'(event, instance) {
		SideNav.closeFlex(() => {
			instance.clearForm();
		});
	},

	'click .save-expertise'(event, instance) {
		event.preventDefault();
		const name = instance.find('#expertise').value.trim();

		if (name) {
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
							return handleError(err);
					}
				}

				// we're done, so close side navigation and navigate to created request-channel
				SideNav.closeFlex(() => {
					instance.clearForm();
				});
				RocketChat.callbacks.run('aftercreateCombined', {_id: result.rid, name});
				FlowRouter.go('expertise', {name}, FlowRouter.current().queryParams);
			});
		} else {
			toastr.error(TAPi18n.__('The_field_is_required', TAPi18n.__('expertise')));
		}
	}
});

Template.AssistifyCreateExpertise.onCreated(function() {
	const instance = this;
	instance.selectedUsers = new ReactiveVar([]);
	instance.selectedUserNames = {};
	instance.isExpert = new ReactiveVar(false);
	instance.error = new ReactiveVar(null);

	Meteor.call('getExperts', function(err, experts) {
		if (err) {
			instance.error.set(err);
			instance.isExpert.set(false);
		} else {
			instance.error.set(null);
			if (experts) {
				instance.isExpert.set(experts.indexOf(Meteor.user().username) !== -1);
			}
		}
	});

	instance.clearForm = function() {
		instance.selectedUsers.set([]);
		instance.find('#expertise').value = '';
		instance.find('#experts').value = '';
	};
});
