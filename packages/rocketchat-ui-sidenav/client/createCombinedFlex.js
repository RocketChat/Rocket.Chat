import _ from 'underscore';

Template.createCombinedFlex.helpers({
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},

	name() {
		return Template.instance().selectedUserNames[this.valueOf()];
	},

	error() {
		return Template.instance().error.get();
	},

	roomName() {
		return Template.instance().roomName.get();
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
						exceptions: [Meteor.user().username].concat(Template.instance().selectedUsers.get())
					},
					selector(match) {
						return { term: match };
					},
					sort: 'username'
				}
			]
		};
	},
	privateSwitchDisabled() {
		return RocketChat.authz.hasAllPermission(['create-c', 'create-p']) ? '' : 'disabled';
	},
	privateSwitchChecked() {
		return RocketChat.authz.hasAllPermission('create-c') ? '' : 'checked';
	}
});

Template.createCombinedFlex.events({
	'autocompleteselect #channel-members'(event, instance, doc) {
		instance.selectedUsers.set(instance.selectedUsers.get().concat(doc.username));

		instance.selectedUserNames[doc.username] = doc.name;

		event.currentTarget.value = '';
		return event.currentTarget.focus();
	},

	'click .remove-room-member'() {
		const self = this;

		let users = Template.instance().selectedUsers.get();
		users = _.reject(Template.instance().selectedUsers.get(), _id => _id === self.valueOf());

		Template.instance().selectedUsers.set(users);

		return $('#channel-members').focus();
	},

	'click header'(e, instance) {
		return SideNav.closeFlex(() => instance.clearForm());
	},

	'click .cancel-channel'(e, instance) {
		return SideNav.closeFlex(() => instance.clearForm());
	},

	'mouseenter header'() {
		return SideNav.overArrow();
	},

	'mouseleave header'() {
		return SideNav.leaveArrow();
	},

	'keydown input[type="text"]'() {
		return Template.instance().error.set([]);
	},

	'keyup #channel-name'(e, instance) {
		if (e.keyCode === 13) {
			return instance.$('#channel-members').focus();
		}
	},

	'keydown #channel-members'(e, instance) {
		if (($(e.currentTarget).val() === '') && (e.keyCode === 13)) {
			return instance.$('.save-channel').click();
		}
	},

	'click .save-channel'(e, instance) {
		const err = SideNav.validate();
		const name = instance.find('#channel-name').value.toLowerCase().trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
		const privateGroup = instance.find('#channel-type').checked;
		const readOnly = instance.find('#channel-ro').checked;
		const createRoute = privateGroup ? 'createPrivateGroup' : 'createChannel';
		const successRoute = privateGroup ? 'group' : 'channel';
		instance.roomName.set(name);
		if (!err) {
			return Meteor.call(createRoute, name, instance.selectedUsers.get(), readOnly, function(err, result) {
				if (err) {
					if (err.error === 'error-invalid-room-name') {
						instance.error.set({ invalid: true });
						return;
					}
					if (err.error === 'error-duplicate-channel-name') {
						instance.error.set({ duplicate: true });
						return;
					}
					if (err.error === 'error-archived-duplicate-name') {
						instance.error.set({ archivedduplicate: true });
						return;
					} else {
						return handleError(err);
					}
				}

				SideNav.closeFlex(() => instance.clearForm());

				if (!privateGroup) {
					RocketChat.callbacks.run('aftercreateCombined', { _id: result.rid, name: result.name });
				}

				return FlowRouter.go(successRoute, { name: result.name }, FlowRouter.current().queryParams);
			});
		} else {
			return instance.error.set({ fields: err });
		}
	}
});

Template.createCombinedFlex.onCreated(function() {
	const instance = this;
	instance.selectedUsers = new ReactiveVar([]);
	instance.selectedUserNames = {};
	instance.error = new ReactiveVar([]);
	instance.roomName = new ReactiveVar('');

	return instance.clearForm = function() {
		instance.error.set([]);
		instance.roomName.set('');
		instance.selectedUsers.set([]);
		instance.find('#channel-name').value = '';
		instance.find('#channel-type').checked = false;
		return instance.find('#channel-members').value = '';
	};
});
