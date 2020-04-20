import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { popover, AccountBox, menu, SideNav, modal } from '../../ui-utils';
import { t } from '../../utils';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { hasAtLeastOnePermission } from '../../authorization';
import { userStatus } from '../../user-status';
import { hasPermission } from '../../authorization/client';
import { createTemplateForComponent } from '../../../client/reactAdapters';


const setStatus = (status, statusText) => {
	AccountBox.setStatus(status, statusText);
	callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const showToolbar = new ReactiveVar(false);

export const toolbarSearch = {
	shortcut: false,
	show(fromShortcut) {
		menu.open();
		showToolbar.set(true);
		this.shortcut = fromShortcut;
	},
	close() {
		showToolbar.set(false);
		if (this.shortcut) {
			menu.close();
		}
	},
};

const toolbarButtons = (/* user */) => [{
	name: t('Home'),
	icon: 'home',
	condition: () => settings.get('Layout_Show_Home_Button'),
	action: () => {
		FlowRouter.go('home');
	},
},
{
	name: t('Search'),
	icon: 'magnifier',
	action: () => {
		toolbarSearch.show(false);
	},
},
{
	name: t('Directory'),
	icon: 'discover',
	action: () => {
		menu.close();
		FlowRouter.go('directory');
	},
},
{
	name: t('Sort'),
	icon: 'sort',
	hasPopup: true,
	action: async (e) => {
		const options = [];
		const config = {
			template: createTemplateForComponent('SortList', () => import('./SortList')),
			currentTarget: e.currentTarget,
			data: {
				options,
			},
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
},
{
	name: t('Create_new'),
	icon: 'edit-rounded',
	condition: () => hasAtLeastOnePermission(['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user']),
	hasPopup: true,
	action: (e) => {
		const action = (title, content) => (e) => {
			e.preventDefault();
			modal.open({
				title: t(title),
				content,
				data: {
					onCreate() {
						modal.close();
					},
				},
				modifier: 'modal',
				showConfirmButton: false,
				showCancelButton: false,
				confirmOnEnter: false,
			});
		};

		const createChannel = action('Create_A_New_Channel', 'createChannel');
		const createDirectMessage = action('Direct_Messages', 'CreateDirectMessage');
		const createDiscussion = action('Discussion_title', 'CreateDiscussion');


		const items = [
			hasAtLeastOnePermission(['create-c', 'create-p'])
			&& {
				icon: 'hashtag',
				name: t('Channel'),
				action: createChannel,
			},
			hasPermission('create-d')
			&& {
				icon: 'team',
				name: t('Direct_Messages'),
				action: createDirectMessage,
			},
			settings.get('Discussion_enabled') && hasAtLeastOnePermission(['start-discussion', 'start-discussion-other-user'])
			&& {
				icon: 'discussion',
				name: t('Discussion'),
				action: createDiscussion,
			},
		].filter(Boolean);

		if (items.length === 1) {
			return items[0].action(e);
		}

		const config = {
			columns: [
				{
					groups: [
						{
							items,
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
},
{
	name: t('Options'),
	icon: 'menu',
	condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
	hasPopup: true,
	action: (e) => {
		let adminOption;
		if (hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions'])) {
			adminOption = {
				icon: 'customize',
				name: t('Administration'),
				type: 'open',
				id: 'administration',
				action: () => {
					SideNav.setFlex('adminFlex');
					SideNav.openFlex();
					FlowRouter.go('admin', { group: 'info' });
					popover.close();
				},
			};
		}

		const config = {
			popoverClass: 'sidebar-header',
			columns: [
				{
					groups: [
						{
							items: AccountBox.getItems().map((item) => {
								let action;

								if (item.href) {
									action = () => {
										FlowRouter.go(item.href);
										popover.close();
									};
								}

								if (item.sideNav) {
									action = () => {
										SideNav.setFlex(item.sideNav);
										SideNav.openFlex();
										popover.close();
									};
								}

								return {
									icon: item.icon,
									name: t(item.name),
									type: 'open',
									id: item.name,
									href: item.href,
									sideNav: item.sideNav,
									action,
								};
							}).concat([adminOption]),
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	},
}];
Template.sidebarHeader.helpers({
	myUserInfo() {
		const id = Meteor.userId();

		if (id == null && settings.get('Accounts_AllowAnonymousRead')) {
			return {
				username: 'anonymous',
				status: 'online',
			};
		}
		return id && Meteor.users.findOne(id, { fields: {
			username: 1, status: 1, statusText: 1,
		} });
	},
	toolbarButtons() {
		return toolbarButtons(/* Meteor.userId() */).filter((button) => !button.condition || button.condition());
	},
	showToolbar() {
		return showToolbar.get();
	},
});

Template.sidebarHeader.events({
	'click .js-button'(e) {
		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
	'click .sidebar__header .avatar'(e) {
		if (!(Meteor.userId() == null && settings.get('Accounts_AllowAnonymousRead'))) {
			const user = Meteor.user();
			const STATUS_MAP = [
				'offline',
				'online',
				'away',
				'busy',
			];
			const userStatusList = Object.keys(userStatus.list).map((key) => {
				const status = userStatus.list[key];
				const name = status.localizeName ? t(status.name) : status.name;
				const modifier = status.statusType || user.status;
				const defaultStatus = STATUS_MAP.includes(status.id);
				const statusText = defaultStatus ? null : name;

				return {
					icon: 'circle',
					name,
					modifier,
					action: () => setStatus(status.statusType, statusText),
				};
			});

			const statusText = user.statusText || t(user.status);

			userStatusList.push({
				icon: 'edit',
				name: t('Edit_Status'),
				type: 'open',
				action: (e) => {
					e.preventDefault();
					modal.open({
						title: t('Edit_Status'),
						content: 'editStatus',
						data: {
							onSave() {
								modal.close();
							},
						},
						modalClass: 'modal',
						showConfirmButton: false,
						showCancelButton: false,
						confirmOnEnter: false,
					});
				},
			});

			const config = {
				popoverClass: 'sidebar-header',
				columns: [
					{
						groups: [
							{
								title: user.name,
								items: [{
									icon: 'circle',
									name: statusText,
									modifier: user.status,
								}],
							},
							{
								title: t('User'),
								items: userStatusList,
							},
							{
								items: [
									{
										icon: 'user',
										name: t('My_Account'),
										type: 'open',
										id: 'account',
										action: () => {
											SideNav.setFlex('accountFlex');
											SideNav.openFlex();
											FlowRouter.go('account');
											popover.close();
										},
									},
									{
										icon: 'sign-out',
										name: t('Logout'),
										type: 'open',
										id: 'logout',
										action: () => {
											Meteor.logout(() => {
												callbacks.run('afterLogoutCleanUp', user);
												Meteor.call('logoutCleanUp', user);
												FlowRouter.go('home');
												popover.close();
											});
										},
									},
								],
							},
						],
					},
				],
				currentTarget: e.currentTarget,
				offsetVertical: e.currentTarget.clientHeight + 10,
			};

			popover.open(config);
		}
	},
});
