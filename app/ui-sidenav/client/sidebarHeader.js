import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { popover, AccountBox, menu, SideNav, modal } from '../../ui-utils';
import { t, getUserPreference, handleError } from '../../utils';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { hasAtLeastOnePermission } from '../../authorization';
import { userStatus } from '../../user-status';

const setStatus = (status, statusText) => {
	AccountBox.setStatus(status, statusText);
	callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const viewModeIcon = {
	extended: 'th-list',
	medium: 'list',
	condensed: 'list-alt',
};

const extendedViewOption = (user) => {
	if (settings.get('Store_Last_Message')) {
		return {
			icon: viewModeIcon.extended,
			name: t('Extended'),
			modifier: getUserPreference(user, 'sidebarViewMode') === 'extended' ? 'bold' : null,
			action: () => {
				Meteor.call('saveUserPreferences', { sidebarViewMode: 'extended' }, function(error) {
					if (error) {
						return handleError(error);
					}
				});
			},
		};
	}
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

const toolbarButtons = (user) => [{
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
	name: t('Service_account_login'),
	icon: 'reload',
	condition: () => !Meteor.user().u || (Meteor.user().u && localStorage.getItem('serviceAccountForceLogin')),
	action: (e) => {
		const options = [];
		const config = {
			template: 'serviceAccountSidebarLogin',
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
	name: t('View_mode'),
	icon: () => viewModeIcon[getUserPreference(user, 'sidebarViewMode') || 'condensed'],
	action: (e) => {
		const hideAvatarSetting = getUserPreference(user, 'sidebarHideAvatar');
		const config = {
			columns: [
				{
					groups: [
						{
							items: [
								extendedViewOption(user),
								{
									icon: viewModeIcon.medium,
									name: t('Medium'),
									modifier: getUserPreference(user, 'sidebarViewMode') === 'medium' ? 'bold' : null,
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarViewMode: 'medium' }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
								{
									icon: viewModeIcon.condensed,
									name: t('Condensed'),
									modifier: getUserPreference(user, 'sidebarViewMode') === 'condensed' ? 'bold' : null,
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarViewMode: 'condensed' }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
							],
						},
						{
							items: [
								{
									icon: 'user-rounded',
									name: hideAvatarSetting ? t('Show_Avatars') : t('Hide_Avatars'),
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarHideAvatar: !hideAvatarSetting }, function(error) {
											if (error) {
												return handleError(error);
											}
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
	},
},
{
	name: t('Sort'),
	icon: 'sort',
	action: (e) => {
		const options = [];
		const config = {
			template: 'sortlist',
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
	condition: () => hasAtLeastOnePermission(['create-c', 'create-p']),
	action: (e) => {
		const createChannel = (e) => {
			e.preventDefault();
			modal.open({
				title: t('Create_A_New_Channel'),
				content: 'createChannel',
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

		const discussionEnabled = settings.get('Discussion_enabled');
		const serviceAccountEnabled = settings.get('Service_account_enabled');
		const items = [{
			icon: 'hashtag',
			name: t('Channel'),
			action: createChannel,
		}];
		if (discussionEnabled) {
			items.push({
				icon: 'discussion',
				name: t('Discussion'),
				action: (e) => {
					e.preventDefault();
					modal.open({
						title: t('Discussion_title'),
						content: 'CreateDiscussion',
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
				},
			});
		}

		if (serviceAccountEnabled && hasAtLeastOnePermission(['create-service-account'])) {
			items.push({
				icon: 'user',
				name: t('Service_account'),
				action: (e) => {
					e.preventDefault();
					modal.open({
						title: t('Service_account_title'),
						content: 'createServiceAccount',
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
				},
			});
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
	condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-integrations', 'manage-oauth-apps', 'manage-own-integrations', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration']),
	action: (e) => {
		let adminOption;
		if (hasAtLeastOnePermission(['manage-emoji', 'manage-integrations', 'manage-oauth-apps', 'manage-own-integrations', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration'])) {
			adminOption = {
				icon: 'customize',
				name: t('Administration'),
				type: 'open',
				id: 'administration',
				action: () => {
					SideNav.setFlex('adminFlex');
					SideNav.openFlex();
					FlowRouter.go('admin-info');
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
		return toolbarButtons(Meteor.userId()).filter((button) => !button.condition || button.condition());
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
