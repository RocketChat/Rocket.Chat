Template.accountBox.helpers({
	myUserInfo() {
		if (Meteor.user() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return {
				name: t('Anonymous'),
				fname: t('Anonymous'),
				status: 'online',
				visualStatus: t('online'),
				username: 'anonymous'
			};
		}

		let visualStatus = 'online';
		const user = Meteor.user() || {};
		const { name, username } = user;
		switch (Session.get(`user_${ username }_status`)) {
			case 'away':
				visualStatus = t('away');
				break;
			case 'busy':
				visualStatus = t('busy');
				break;
			case 'offline':
				visualStatus = t('invisible');
				break;
		}
		return {
			name: Session.get(`user_${ username }_name`) || username,
			status: Session.get(`user_${ username }_status`),
			visualStatus,
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
	}
});

Template.accountBox.events({
	'click .options .status'(event) {
		event.preventDefault();
		AccountBox.setStatus(event.currentTarget.dataset.status);
		return RocketChat.callbacks.run('userStatusManuallySet', event.currentTarget.dataset.status);
	},

	'click .account-box'() {
		if (Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return;
		}

		return AccountBox.toggle();
	},

	'click #logout'(event) {
		event.preventDefault();
		const user = Meteor.user();
		return Meteor.logout(function() {
			RocketChat.callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			return FlowRouter.go('home');
		});
	},

	'click #avatar'() {
		return FlowRouter.go('changeAvatar');
	},

	'click #account'() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
		return FlowRouter.go('account');
	},

	'click #admin'() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
		return FlowRouter.go('admin-info');
	},

	'click .account-link'(event) {
		event.stopPropagation();
		event.preventDefault();
		return AccountBox.openFlex();
	},

	'click .account-box-item'() {
		if (this.href) {
			FlowRouter.go(this.href);
		}

		if (this.sideNav != null) {
			SideNav.setFlex(this.sideNav);
			return SideNav.openFlex();
		}
	}
});

Template.accountBox.onRendered(() => AccountBox.init());
