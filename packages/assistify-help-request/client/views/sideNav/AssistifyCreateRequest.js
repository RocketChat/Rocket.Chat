/* globals RocketChat, FlowRouter, TAPi18n, console */
import toastr from 'toastr';

Template.AssistifyCreateRequest.helpers({
	autocompleteExpertiseSettings() {
		return {
			limit: 10,
			// inputDelay: 300
			rules: [
				{
					// @TODO maybe change this 'collection' and/or template
					collection: 'expertise',
					subscription: 'autocompleteExpertise', //a server side publication providing the query
					field: 'name',
					template: Template.roomSearch,
					noMatchTemplate: Template.roomSearchEmpty,
					matchAll: true,
					selector(match) {
						return {name: match};
					},
					sort: 'name'
				}
			]
		};
	}
});

Template.AssistifyCreateRequest.events({
	'autocompleteselect #expertise-search'(event, instance, doc) {
		instance.expertise.set(doc.name);

		return instance.find('.save-request').focus();
	},

	'keydown #request-name'(event, instance) {
		if ($(event.currentTarget).val().trim() !== '' && event.keyCode === 13) {
			instance.$('.save-request').click();
			SideNav.closeFlex(() => {
				instance.clearForm();
			});
		}
	},

	'click .cancel-request'(event, instance) {
		SideNav.closeFlex(() => {
			instance.clearForm();
		});
	},

	'click .save-request'(event, instance) {
		event.preventDefault();
		const expertise = instance.find('#expertise-search').value.trim();
		instance.requestRoomName.set(name);

		if (name || expertise) {
			Meteor.call('createRequest', name, expertise, (err, result) => {
				if (err) {
					console.log(err);
					switch (err.error) {
						case 'error-invalid-name':
							toastr.error(TAPi18n.__('Invalid_room_name', `${ expertise }...`));
							return;
						case 'error-duplicate-channel-name':
							toastr.error(TAPi18n.__('Request_already_exists'));
							return;
						case 'error-archived-duplicate-name':
							toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
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
				const roomCreated = RocketChat.models.Rooms.findOne({_id: result.rid});
				FlowRouter.go('request', {name: roomCreated.name}, FlowRouter.current().queryParams);
			});
		} else {
			toastr.error(TAPi18n.__('The_field_is_required', TAPi18n.__('request-name')));
		}
	}
});

Template.AssistifyCreateRequest.onCreated(function() {
	const instance = this;
	instance.requestRoomName = new ReactiveVar('');
	instance.expertise = new ReactiveVar('');

	instance.clearForm = function() {
		instance.requestRoomName.set('');
		instance.expertise.set('');
		instance.find('#expertise-search').value = '';
	};
});
