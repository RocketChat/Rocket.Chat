import toastr from 'toastr';

Template.permissionsRole.helpers({
	role() {
		return RocketChat.models.Roles.findOne({
			_id: FlowRouter.getParam('name')
		}) || {};
	},

	userInRole() {
		return Template.instance().usersInRole.get();
	},

	editing() {
		return FlowRouter.getParam('name') != null;
	},

	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	},

	hasPermission() {
		return RocketChat.authz.hasAllPermission('access-permissions');
	},

	protected() {
		return this.protected;
	},

	editable() {
		return this._id && !this.protected;
	},

	hasUsers() {
		return Template.instance().usersInRole.get() && Template.instance().usersInRole.get().count() > 0;
	},

	hasMore() {
		const instance = Template.instance();
		return instance.limit && instance.limit.get() <= instance.usersInRole.get().count();
	},

	isLoading() {
		const instance = Template.instance();
		if (!instance.ready || !instance.ready.get()) {
			return 'btn-loading';
		}
	},

	searchRoom() {
		return Template.instance().searchRoom.get();
	},

	autocompleteChannelSettings() {
		return {
			limit: 10,
			rules: [
				{
					collection: 'CachedChannelList',
					subscription: 'channelAndPrivateAutocomplete',
					field: 'name',
					template: Template.roomSearch,
					noMatchTemplate: Template.roomSearchEmpty,
					matchAll: true,
					sort: 'name',
					selector(match) {
						return {
							name: match
						};
					}
				}
			]
		};
	},

	autocompleteUsernameSettings() {
		const instance = Template.instance();
		return {
			limit: 10,
			rules: [
				{
					collection: 'CachedUserList',
					subscription: 'userAutocomplete',
					field: 'username',
					template: Template.userSearch,
					noMatchTemplate: Template.userSearchEmpty,
					matchAll: true,
					filter: {
						exceptions: instance.usersInRole.get() && instance.usersInRole.get().fetch()
					},
					selector(match) {
						return {
							term: match
						};
					},
					sort: 'username'
				}
			]
		};
	}
});

Template.permissionsRole.events({
	'click .remove-user'(e, instance) {
		e.preventDefault();
		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('authorization:removeUserFromRole', FlowRouter.getParam('name'), this.username, instance.searchRoom.get(), function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}

				modal.open({
					title: t('Removed'),
					text: t('User_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	},

	'submit #form-role'(e/*, instance*/) {
		e.preventDefault();
		const oldBtnValue = e.currentTarget.elements['save'].value;
		e.currentTarget.elements['save'].value = t('Saving');
		const roleData = {
			description: e.currentTarget.elements['description'].value,
			scope: e.currentTarget.elements['scope'].value
		};

		if (this._id) {
			roleData.name = this._id;
		} else {
			roleData.name = e.currentTarget.elements['name'].value;
		}

		Meteor.call('authorization:saveRole', roleData, (error/*, result*/) => {
			e.currentTarget.elements['save'].value = oldBtnValue;
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));

			if (!this._id) {
				return FlowRouter.go('admin-permissions-edit', {
					name: roleData.name
				});
			}
		});
	},

	'submit #form-users'(e, instance) {
		e.preventDefault();
		if (e.currentTarget.elements['username'].value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}
		const oldBtnValue = e.currentTarget.elements['add'].value;
		e.currentTarget.elements['add'].value = t('Saving');

		Meteor.call('authorization:addUserToRole', FlowRouter.getParam('name'), e.currentTarget.elements['username'].value, instance.searchRoom.get(), (error/*, result*/) => {
			e.currentTarget.elements['add'].value = oldBtnValue;
			if (error) {
				return handleError(error);
			}
			instance.subscribe('usersInRole', FlowRouter.getParam('name'), instance.searchRoom.get());
			toastr.success(t('User_added'));
			e.currentTarget.reset();
		});
	},

	'submit #form-search-room'(e) {
		return e.preventDefault();
	},

	'click .delete-role'(e/*, instance*/) {
		e.preventDefault();
		if (this.protected) {
			return toastr.error(t('error-delete-protected-role'));
		}

		Meteor.call('authorization:deleteRole', this._id, function(error/*, result*/) {
			if (error) {
				return handleError(error);
			}
			toastr.success(t('Deleted'));
			FlowRouter.go('admin-permissions');
		});
	},

	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},

	'autocompleteselect input[name=room]'(event, template, doc) {
		template.searchRoom.set(doc._id);
	}
});

Template.permissionsRole.onCreated(function() {
	this.searchRoom = new ReactiveVar;
	this.searchUsername = new ReactiveVar;
	this.usersInRole = new ReactiveVar;
	this.limit = new ReactiveVar(50);
	this.ready = new ReactiveVar(true);
	this.subscribe('roles', FlowRouter.getParam('name'));

	this.autorun(() => {
		if (this.searchRoom.get()) {
			this.subscribe('roomSubscriptionsByRole', this.searchRoom.get(), FlowRouter.getParam('name'));
		}

		const limit = this.limit.get();

		const subscription = this.subscribe('usersInRole', FlowRouter.getParam('name'), this.searchRoom.get(), limit);
		this.ready.set(subscription.ready());

		this.usersInRole.set(RocketChat.models.Roles.findUsersInRole(FlowRouter.getParam('name'), this.searchRoom.get(), {
			sort: {
				username: 1
			}
		}));
	});
});
