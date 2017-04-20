Template.privateGroupsFlex.helpers({
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},

	name() {
		return Template.instance().selectedUserNames[this.valueOf()];
	},

	groupName() {
		return Template.instance().groupName.get();
	},

	error() {
		return Template.instance().error.get();
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
	}});

Template.privateGroupsFlex.events({
	'autocompleteselect #pvt-group-members'(event, instance, doc) {
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

		return $('#pvt-group-members').focus();
	},

	'click .cancel-pvt-group'(e, instance) {
		return SideNav.closeFlex(() => instance.clearForm());
	},

	'click header'(e, instance) {
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

	'keyup #pvt-group-name'(e, instance) {
		if (e.keyCode === 13) {
			return instance.$('#pvt-group-members').focus();
		}
	},

	'keydown #pvt-group-members'(e, instance) {
		if (($(e.currentTarget).val() === '') && (e.keyCode === 13)) {
			return instance.$('.save-pvt-group').click();
		}
	},

	'click .save-pvt-group'(e, instance) {
		const err = SideNav.validate();
		const name = instance.find('#pvt-group-name').value.toLowerCase().trim();
		const readOnly = instance.find('#channel-ro').checked;
		instance.groupName.set(name);
		if (!err) {
			return Meteor.call('createPrivateGroup', name, instance.selectedUsers.get(), readOnly, function(err) {
				if (err) {
					if (err.error === 'error-invalid-name') {
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
					}
					return handleError(err);
				}
				SideNav.closeFlex();
				instance.clearForm();
				return FlowRouter.go('group', { name }, FlowRouter.current().queryParams);
			});
		} else {
			return Template.instance().error.set({fields: err});
		}
	}
});

Template.privateGroupsFlex.onCreated(function() {
	const instance = this;
	instance.selectedUsers = new ReactiveVar([]);
	instance.selectedUserNames = {};
	instance.error = new ReactiveVar([]);
	instance.groupName = new ReactiveVar('');

	return instance.clearForm = function() {
		instance.error.set([]);
		instance.groupName.set('');
		instance.selectedUsers.set([]);
		instance.find('#pvt-group-name').value = '';
		return instance.find('#pvt-group-members').value = '';
	};
});
