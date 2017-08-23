Template.accountBox.helpers({
	myUserInfo() {
		if (Meteor.user() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return {
				name: t('Anonymous'),
				fname: t('Anonymous'),
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
			fname: name || username
		};
	},

	showAdminOption() {
		return RocketChat.authz.hasAtLeastOnePermission(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting' ]) || (RocketChat.AdminBox.getOptions().length > 0);
	},

	registeredMenus() {
		return AccountBox.getItems();
	},

	isAnonymous() {
		if (Meteor.user() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return 'disabled';
		}
	}
});

Template.accountBox.events({
	'click [data-action="set-state"]'(e) {
		e.preventDefault();
		AccountBox.setStatus(e.currentTarget.dataset.status);
		$('[data-popover="anchor"]:checked').prop('checked', false);
		RocketChat.callbacks.run('userStatusManuallySet', e.currentTarget.dataset.status);
	},

	'click [data-action="open"]'(e) {
		e.preventDefault();
		$('[data-popover="anchor"]:checked').prop('checked', false);

		const open = e.currentTarget.dataset.open;

		switch (open) {
			case 'account':
				SideNav.setFlex('accountFlex');
				SideNav.openFlex();
				FlowRouter.go('account');
				break;
			case 'logout':
				const user = Meteor.user();
				Meteor.logout(() => {
					RocketChat.callbacks.run('afterLogoutCleanUp', user);
					Meteor.call('logoutCleanUp', user);
					FlowRouter.go('home');
				});
				break;
			case 'administration':
				SideNav.setFlex('adminFlex');
				SideNav.openFlex();
				FlowRouter.go('admin-info');
				break;
		}

		if (this.href) {
			FlowRouter.go(this.href);
		}

		if (this.sideNav != null) {
			SideNav.setFlex(this.sideNav);
			SideNav.openFlex();
		}
	}
});

Template.accountBox.onRendered(() => AccountBox.init());
