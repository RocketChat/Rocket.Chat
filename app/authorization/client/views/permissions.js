import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { Roles } from '../../../models/client';
import { ChatPermissions } from '../lib/ChatPermissions';
import { hasAllPermission } from '../hasPermission';
import { t } from '../../../utils/client';
import { SideNav } from '../../../ui-utils/client/lib/SideNav';
import { CONSTANTS, AuthorizationUtils } from '../../lib';

import { hasAtLeastOnePermission } from '..';

Template.permissions.helpers({
	tabsData() {
		const {
			state,
		} = Template.instance();

		const permissionsTab = {
			label: t('Permissions'),
			value: 'permissions',
			condition() {
				return true;
			},
		};

		const settingsTab = {
			label: t('Settings'),
			value: 'settings',
			condition() {
				return true;
			},
		};

		const tabs = [permissionsTab];

		const settingsPermissions = hasAllPermission('access-setting-permissions');

		if (settingsPermissions) {
			tabs.push(settingsTab);
		}
		switch (settingsPermissions && state.get('tab')) {
			case 'settings':
				settingsTab.active = true;
				break;
			case 'permissions':
				permissionsTab.active = true;
				break;
			default:
				permissionsTab.active = true;
		}


		return {
			tabs,
			onChange(value) {
				state.set({
					tab: value,
					size: 50,
				});
			},
		};
	},
	roles() {
		return Roles.find();
	},

	permissions() {
		const { state } = Template.instance();
		const limit = state.get('size');
		const filter = new RegExp(s.escapeRegExp(state.get('filter')), 'i');

		return ChatPermissions.find(
			{
				level: { $ne: CONSTANTS.SETTINGS_LEVEL },
				_id: filter,
			},
			{
				sort: {
					_id: 1,
				},
				limit,
			},
		);
	},

	settingPermissions() {
		const { state } = Template.instance();
		const limit = state.get('size');
		const filter = new RegExp(s.escapeRegExp(state.get('filter')), 'i');
		return ChatPermissions.find(
			{
				_id: filter,
				level: CONSTANTS.SETTINGS_LEVEL,
				group: { $exists: true },
			},
			{
				limit,
				sort: {
					group: 1,
					section: 1,
				},
			},
		);
	},

	hasPermission() {
		return hasAllPermission('access-permissions');
	},

	hasNoPermission() {
		return !hasAtLeastOnePermission([
			'access-permissions',
			'access-setting-permissions',
		]);
	},
	filter() {
		return Template.instance().state.get('filter');
	},

	tab() {
		return Template.instance().state.get('tab');
	},
});

Template.permissions.events({
	'keyup #permissions-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.state.set('filter', e.currentTarget.value);
	},
	'scroll .content': _.throttle(({ currentTarget }, i) => {
		if (
			currentTarget.offsetHeight + currentTarget.scrollTop
			>= currentTarget.scrollHeight - 100
		) {
			return i.state.set('size', i.state.get('size') + 50);
		}
	}, 300),
});

Template.permissions.onCreated(function() {
	this.state = new ReactiveDict({
		filter: '',
		tab: '',
		size: 50,
	});

	this.autorun(() => {
		this.state.get('filter');
		this.state.set('size', 50);
	});
});

Template.permissionsTable.helpers({
	granted(roles, role) {
		return (roles && ~roles.indexOf(role._id) && 'checked') || null;
	},

	permissionName(permission) {
		if (permission.level === CONSTANTS.SETTINGS_LEVEL) {
			let path = '';
			if (permission.group) {
				path = `${ t(permission.group) } > `;
			}
			if (permission.section) {
				path = `${ path }${ t(permission.section) } > `;
			}
			return `${ path }${ t(permission.settingId) }`;
		}

		return t(permission._id);
	},

	permissionDescription(permission) {
		return t(`${ permission._id }_description`);
	},

	isRolePermissionEnabled(role, permission) {
		return !AuthorizationUtils.isPermissionRestrictedForRole(permission._id, role._id);
	},
});

Template.permissionsTable.events({
	'click .role-permission'(e) {
		const permissionId = e.currentTarget.getAttribute('data-permission');
		const role = e.currentTarget.getAttribute('data-role');

		const permission = permissionId && ChatPermissions.findOne(permissionId);

		const action = ~permission.roles.indexOf(role) ? 'authorization:removeRoleFromPermission' : 'authorization:addPermissionToRole';

		return Meteor.call(action, permissionId, role);
	},
});

Template.permissions.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
