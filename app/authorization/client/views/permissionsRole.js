import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';

import { handleError } from '../../../utils/client/lib/handleError';
import { t } from '../../../utils/lib/tapi18n';
import { Roles } from '../../../models';
import { hasAllPermission } from '../hasPermission';
import { modal } from '../../../ui-utils/client/lib/modal';
import { SideNav } from '../../../ui-utils/client/lib/SideNav';
import { APIClient } from '../../../utils/client';
import { call } from '../../../ui-utils/client';

const PAGE_SIZE = 50;

const loadUsers = async (instance) => {
	const offset = instance.state.get('offset');

	const rid = instance.searchRoom.get();

	const params = {
		role: FlowRouter.getParam('name'),
		offset,
		count: PAGE_SIZE,
		...rid && { roomId: rid },
	};

	instance.state.set('loading', true);
	const { users } = await APIClient.v1.get('roles.getUsersInRole', params);

	instance.usersInRole.set(instance.usersInRole.curValue.concat(users));
	instance.state.set({
		loading: false,
		hasMore: users.length === PAGE_SIZE,
	});
};

Template.permissionsRole.helpers({
	role() {
		return Roles.findOne({
			_id: FlowRouter.getParam('name'),
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
		return hasAllPermission('access-permissions');
	},

	protected() {
		return this.protected;
	},

	editable() {
		return this._id && !this.protected;
	},

	hasUsers() {
		return Template.instance().usersInRole.get().length > 0;
	},

	hasMore() {
		return Template.instance().state.get('hasMore');
	},

	isLoading() {
		const instance = Template.instance();
		return (!instance.subscription.ready() || instance.state.get('loading')) && 'btn-loading';
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
							name: match,
						};
					},
				},
			],
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
						exceptions: instance.usersInRole.get(),
					},
					selector(match) {
						return {
							term: match,
						};
					},
					sort: 'username',
				},
			],
		};
	},
});

Template.permissionsRole.events({
	async 'click .remove-user'(e, instance) {
		e.preventDefault();
		modal.open({
			title: t('Are_you_sure'),
			text: t('The_user_s_will_be_removed_from_role_s', this.username, FlowRouter.getParam('name')),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, async () => {
			await call('authorization:removeUserFromRole', FlowRouter.getParam('name'), this.username, instance.searchRoom.get());
			instance.usersInRole.set(instance.usersInRole.curValue.filter((user) => user.username !== this.username));
			modal.open({
				title: t('Removed'),
				text: t('User_removed'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false,
			});
		});
	},

	'submit #form-role'(e/* , instance*/) {
		e.preventDefault();
		const oldBtnValue = e.currentTarget.elements.save.value;
		e.currentTarget.elements.save.value = t('Saving');
		const roleData = {
			description: e.currentTarget.elements.description.value,
			scope: e.currentTarget.elements.scope.value,
			mandatory2fa: e.currentTarget.elements.mandatory2fa.checked,
		};

		if (this._id) {
			roleData.name = this._id;
		} else {
			roleData.name = e.currentTarget.elements.name.value;
		}

		Meteor.call('authorization:saveRole', roleData, (error/* , result*/) => {
			e.currentTarget.elements.save.value = oldBtnValue;
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));

			if (!this._id) {
				return FlowRouter.go('admin-permissions-edit', {
					name: roleData.name,
				});
			}
		});
	},

	async 'submit #form-users'(e, instance) {
		e.preventDefault();
		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}
		const oldBtnValue = e.currentTarget.elements.add.value;
		e.currentTarget.elements.add.value = t('Saving');

		try {
			await call('authorization:addUserToRole', FlowRouter.getParam('name'), e.currentTarget.elements.username.value, instance.searchRoom.get());
			instance.usersInRole.set([]);
			instance.state.set({
				offset: 0,
				cache: Date.now(),
			});
			toastr.success(t('User_added'));
			e.currentTarget.reset();
		} finally {
			e.currentTarget.elements.add.value = oldBtnValue;
		}
	},

	'submit #form-search-room'(e) {
		return e.preventDefault();
	},

	'click .delete-role'(e/* , instance*/) {
		e.preventDefault();
		if (this.protected) {
			return toastr.error(t('error-delete-protected-role'));
		}

		Meteor.call('authorization:deleteRole', this._id, function(error/* , result*/) {
			if (error) {
				return handleError(error);
			}
			toastr.success(t('Role_removed'));
			FlowRouter.go('admin-permissions');
		});
	},

	'click .load-more'(e, t) {
		t.state.set('offset', t.state.get('offset') + PAGE_SIZE);
	},

	'autocompleteselect input[name=room]'(event, template, doc) {
		template.searchRoom.set(doc._id);
	},
});

Template.permissionsRole.onCreated(async function() {
	this.state = new ReactiveDict({
		offset: 0,
		loading: false,
		hasMore: true,
		cache: 0,
	});
	this.searchRoom = new ReactiveVar();
	this.searchUsername = new ReactiveVar();
	this.usersInRole = new ReactiveVar([]);

	this.subscription = this.subscribe('roles', FlowRouter.getParam('name'));
});

Template.permissionsRole.onRendered(function() {
	this.autorun(() => {
		this.searchRoom.get();
		this.usersInRole.set([]);
		this.state.set({ offset: 0 });
	});

	this.autorun(() => {
		this.state.get('cache');
		loadUsers(this);
	});

	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
