/* globals popover menu */
const setStatus = status => {
	AccountBox.setStatus(status);
	RocketChat.callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const viewModeIcon = {
	extended: 'th-list',
	medium: 'list',
	condensed: 'list-alt'
};

const extendedViewOption = (user) => {
	if (RocketChat.settings.get('Store_Last_Message')) {
		return {
			icon: viewModeIcon.extended,
			name: t('Extended'),
			modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'extended' ? 'bold' : null,
			action: () => {
				Meteor.call('saveUserPreferences', {sidebarViewMode: 'extended'}, function(error) {
					if (error) {
						return handleError(error);
					}
				});
			}
		};
	}

	return;
};


const toolbarButtons = (user) => {
	return [{
		name: t('Search'),
		icon: 'magnifier',
		action: () => {
			const toolbarEl = $('.toolbar');
			toolbarEl.css('display', 'block');
			toolbarEl.find('.rc-input__element').focus();
		}
	},
	{
		name: t('Directory'),
		icon: 'globe',
		action: () => {
			menu.close();
			FlowRouter.go('directory');
		}
	},
	{
		name: t('View_mode'),
		icon: () => RocketChat.getUserPreference(user, 'sidebarViewMode') ? viewModeIcon[RocketChat.getUserPreference(user, 'sidebarViewMode')] : viewModeIcon.condensed,
		action: (e) => {
			const hideAvatarSetting = RocketChat.getUserPreference(user, 'sidebarHideAvatar');
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
										modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'medium' ? 'bold' : null,
										action: () => {
											Meteor.call('saveUserPreferences', {sidebarViewMode: 'medium'}, function(error) {
												if (error) {
													return handleError(error);
												}
											});
										}
									},
									{
										icon: viewModeIcon.condensed,
										name: t('Condensed'),
										modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'condensed' ? 'bold' : null,
										action: () => {
											Meteor.call('saveUserPreferences', {sidebarViewMode: 'condensed'}, function(error) {
												if (error) {
													return handleError(error);
												}
											});
										}
									}
								]
							},
							{
								items: [
									{
										icon: 'user-rounded',
										name: hideAvatarSetting ? t('Show_Avatars') : t('Hide_Avatars'),
										action: () => {
											Meteor.call('saveUserPreferences', {sidebarHideAvatar: !hideAvatarSetting}, function(error) {
												if (error) {
													return handleError(error);
												}
											});
										}
									}
								]
							}
						]
					}
				],
				mousePosition: () => ({
					x: e.currentTarget.getBoundingClientRect().left,
					y: e.currentTarget.getBoundingClientRect().bottom + 50
				}),
				customCSSProperties: () => ({
					top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
					left: `${ e.currentTarget.getBoundingClientRect().left - 10 }px`
				})
			};

			popover.open(config);
		}
	},
	{
		name: t('Sort'),
		icon: 'sort',
		action: (e) => {
			const options = [];
			const config = {
				template: 'sortlist',
				mousePosition: () => ({
					x: e.currentTarget.getBoundingClientRect().left,
					y: e.currentTarget.getBoundingClientRect().bottom + 50
				}),
				customCSSProperties: () => ({
					top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
					left: `${ e.currentTarget.getBoundingClientRect().left - 10 }px`
				}),
				data: {
					// value: instance.form[key].get(),
					options
				}
			};
			popover.open(config);
		}
	},
	{
		name: t('Create_A_New_Channel'),
		icon: 'edit-rounded',
		condition: () => RocketChat.authz.hasAtLeastOnePermission(['create-c', 'create-p']),
		action: () => {
			menu.close();
			FlowRouter.go('create-channel');
		}
	},
	{
		name: t('Options'),
		icon: 'menu',
		condition: () => AccountBox.getItems().length || RocketChat.authz.hasAtLeastOnePermission(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting', 'manage-emoji' ]),
		action: (e) => {
			let adminOption;
			if (RocketChat.authz.hasAtLeastOnePermission(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting', 'manage-emoji' ])) {
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
					}
				};
			}

			const config = {
				popoverClass: 'sidebar-header',
				columns: [
					{
						groups: [
							{
								items: AccountBox.getItems().map(item => {
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
										action
									};
								}).concat([adminOption])
							}
						]
					}
				],
				mousePosition: () => ({
					x: e.currentTarget.getBoundingClientRect().left,
					y: e.currentTarget.getBoundingClientRect().bottom + 50
				}),
				customCSSProperties: () => ({
					top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
					left: `${ e.currentTarget.getBoundingClientRect().left - 10 }px`
				})
			};

			popover.open(config);
		}
	}];
};
Template.sidebarHeader.helpers({
	myUserInfo() {
		if (Meteor.user() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return {
				username: 'anonymous',
				status: 'online'
			};
		}

		const user = Meteor.user() || {};
		const { username } = user;
		const userStatus = Session.get(`user_${ username }_status`);

		return {
			username,
			status: userStatus
		};
	},
	toolbarButtons() {
		return toolbarButtons(Meteor.user()).filter(button => !button.condition || button.condition());
	}
});

Template.sidebarHeader.events({
	'click .js-button'(e) {
		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
	'click .sidebar__header .avatar'(e) {
		if (!(Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead'))) {
			const user = Meteor.user();
			const config = {
				popoverClass: 'sidebar-header',
				columns: [
					{
						groups: [
							{
								title: t('User'),
								items: [
									{
										icon: 'circle',
										name: t('Online'),
										modifier: 'online',
										action: () => setStatus('online')
									},
									{
										icon: 'circle',
										name: t('Away'),
										modifier: 'away',
										action: () => setStatus('away')
									},
									{
										icon: 'circle',
										name: t('Busy'),
										modifier: 'busy',
										action: () => setStatus('busy')
									},
									{
										icon: 'circle',
										name: t('Invisible'),
										modifier: 'offline',
										action: () => setStatus('offline')
									}
								]
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
										}
									},
									{
										icon: 'sign-out',
										name: t('Logout'),
										type: 'open',
										id: 'logout',
										action: () => {
											Meteor.logout(() => {
												RocketChat.callbacks.run('afterLogoutCleanUp', user);
												Meteor.call('logoutCleanUp', user);
												FlowRouter.go('home');
												popover.close();
											});
										}
									}
								]
							}
						]
					}
				],
				mousePosition: () => ({
					x: e.currentTarget.getBoundingClientRect().left,
					y: e.currentTarget.getBoundingClientRect().bottom + 50
				}),
				customCSSProperties: () => ({
					top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
					left: `${ e.currentTarget.getBoundingClientRect().left - 10 }px`
				})
			};

			popover.open(config);
		}
	}
});
