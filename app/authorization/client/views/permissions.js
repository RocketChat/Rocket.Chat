import _ from 'underscore';
import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { Roles, Users } from '../../../models';
import { ChatPermissions } from '../lib/ChatPermissions';
import { hasAllPermission } from '../hasPermission';

import { hasAtLeastOnePermission } from '..';

import { t } from '../../../utils/client';
import { SideNav } from '../../../ui-utils/client/lib/SideNav';
import { call } from '../../../ui-utils/client';
import { CONSTANTS } from '../../lib';

Template.permissions.helpers({
	tabsData() {
		const {
			state,
		} = Template.instance();

		const permissionsTab = {
			label: t('Permissons'),
			value: 'permissons',
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
		const userLevel = Template.instance().state.get('userLevel');
		return Roles.find({
			$or: [{ level: { $lte: userLevel } }, { level: { $exists: false } }],
		});
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
			}
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
					// sorting seems not to be copied from the publication, we need to request it explicitly in find()
					group: 1,
					section: 1,
				},
			}
		); // group permissions are assigned implicitly,  we can hide them. $exists: {group:false} not supported by Minimongo
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
		userLevel: 0,
		filter: '',
		tab: '',
		size: 50,
	});

	this.autorun(() => {
		const { roles } = Users.findOne(Meteor.userId(), { fields: { roles: 1 } });
		const level = Roles.find({ _id: { $in: roles } }).fetch().reduce((currentLevel, { level }) => (currentLevel > level ? currentLevel : level), 0);
		this.state.set('userLevel', level);
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
});

Template.permissionsTable.events({
	'click .role-permission'(e) {
		e.preventDefault();

		const permissionId = e.currentTarget.getAttribute('data-permission');
		const role = e.currentTarget.getAttribute('data-role');

		const permission = permissionId && ChatPermissions.findOne(permissionId);

		const action = ~permission.roles.indexOf(role) ? 'authorization:removeRoleFromPermission' : 'authorization:addPermissionToRole';

		call(action, permission, role);
	},
});

Template.permissions.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
