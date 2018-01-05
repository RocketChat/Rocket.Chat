/* globals popover isRtl */

Template.accountBox.helpers({
	myUserInfo() {
		if (Meteor.user() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return {
				name: t('Anonymous'),
				fname: RocketChat.settings.get('UI_Use_Real_Name') && t('Anonymous'),
				status: 'online',
				visualStatus: t('online'),
				bullet: 'general-success-background',
				username: 'anonymous'
			};
		}

		const user = Meteor.user() || {};
		const { name, username } = user;
		const userStatus = Session.get(`user_${ username }_status`);

		return {
			name: Session.get(`user_${ username }_name`) || username,
			status: Session.get(`user_${ username }_status`),
			visualStatus: t(userStatus.charAt(0).toUpperCase() + userStatus.slice(1)),
			bullet: userStatus,
			_id: Meteor.userId(),
			username,
			fname: RocketChat.settings.get('UI_Use_Real_Name') && name
		};
	},

	isAnonymous() {
		if (Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return 'disabled';
		}
	}
});

Template.accountBox.events({
	'click .sidebar__account.active'() {
		let adminOption;
		if (RocketChat.authz.hasAtLeastOnePermission(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting' ]) || (RocketChat.AdminBox.getOptions().length > 0)) {
			adminOption = {
				icon: 'customize',
				name: t('Administration'),
				type: 'open',
				id: 'administration'
			};
		}

		const accountBox = document.querySelector('.sidebar__account');

		const config = {
			popoverClass: 'account',
			columns: [
				{
					groups: [
						{
							title: t('User'),
							items: Object.keys(RocketChat.userStatus.list).map((key,index) => {
								const userStatus = RocketChat.userStatus.list[key];
								return {
									icon: 'circle',
									name: userStatus.localizeName ? t(userStatus.name) : userStatus.name,
									type: 'set-state',
									statusType: userStatus.statusType,
									id: userStatus.id,
									modifier: userStatus.statusType
								};
							})
						},
						{
							items: AccountBox.getItems().map(item => {
								return {
									icon: item.icon,
									name: t(item.name),
									type: 'open',
									id: item.name,
									href: item.href,
									sideNav: item.sideNav
								};
							}).concat([
								adminOption,
								{
									icon: 'user',
									name: t('My_Account'),
									type: 'open',
									id: 'account'
								},
								{
									icon: 'sign-out',
									name: t('Logout'),
									type: 'open',
									id: 'logout'
								}
							])
						}

					]
				}
			],
			position: {
				top: accountBox.offsetHeight
			},
			customCSSProperties: {
				width: `${ accountBox.offsetWidth - parseInt(getComputedStyle(accountBox)['padding-left'].replace('px', '')) * 2 }px`,
				left: isRtl() ? 'auto' : getComputedStyle(accountBox)['padding-left'],
				right: 'auto'
			}
		};

		popover.open(config);
	}
});

Template.accountBox.onRendered(() => AccountBox.init());
