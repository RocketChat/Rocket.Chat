/* globals ChatSubscription */

Template.pushNotificationsFlexTab.helpers({
	desktopNotifications() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				desktopNotifications: 1
			}
		});
		return sub ? sub.desktopNotifications : '';
	},
	mobilePushNotifications() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				mobilePushNotifications: 1
			}
		});
		return sub ? sub.mobilePushNotifications : '';
	},
	emailNotifications() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				emailNotifications: 1
			}
		});
		return sub ? sub.emailNotifications : '';
	},
	showEmailMentions() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				t: 1
			}
		});
		return sub && sub.t !== 'd';
	},
	subValue(field) {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				t: 1,
				[field]: 1
			}
		});
		if (sub) {
			switch (sub[field]) {
				case 'all':
					return t('All_messages');
				case 'nothing':
					return t('Nothing');
				case 'default':
					return t('Use_account_preference');
				case 'mentions':
					return t('Mentions');
				default:
					if (field === 'emailNotifications') {
						return t('Use_account_preference');
					} else {
						return t('Mentions');
					}
			}
		}
	},
	desktopNotificationDuration() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				desktopNotificationDuration: 1
			}
		});
		if (!sub) {
			return false;
		}
		return sub.desktopNotificationDuration | 0;
	},
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	emailVerified() {
		return Meteor.user().emails && Meteor.user().emails[0] && Meteor.user().emails[0].verified;
	}
});

Template.pushNotificationsFlexTab.onCreated(function() {
	this.editing = new ReactiveVar();

	this.validateSetting = (field) => {
		const value = this.$('input[name='+ field +']:checked').val();
		if (['all', 'mentions', 'nothing', 'default'].indexOf(value) === -1) {
			toastr.error(t('Invalid_notification_setting_s', value || ''));
			return false;
		}
		return true;
	};

	this.saveSetting = () => {
		const field = this.editing.get();
		const value = this.$('input[name='+ field +']:checked').val();
		if (this.validateSetting(field)) {
			Meteor.call('saveNotificationSettings', Session.get('openedRoom'), field, value, (err/*, result*/) => {
				if (err) {
					return handleError(err);
				}
				this.editing.set();
			});
		}
	};
});

Template.pushNotificationsFlexTab.events({
	'keydown input[type=text]'(e, instance) {
		if (e.keyCode === 13) {
			e.preventDefault();
			instance.saveSetting();
		}
	},

	'change input[name=duration]'(e, instance) {
		const value = instance.$('input[name=duration]').val();
		Meteor.call('saveDesktopNotificationDuration', Session.get('openedRoom'), value, (err) => {
			if (err) {
				return handleError(err);
			}
		});
	},

	'click [data-edit]'(e, instance) {
		e.preventDefault();
		instance.editing.set($(e.currentTarget).data('edit'));
		setTimeout(function() { instance.$('input.editing').focus().select(); }, 100);
	},

	'click .cancel'(e, instance) {
		e.preventDefault();
		instance.editing.set();
	},

	'click .save'(e, instance) {
		e.preventDefault();
		instance.saveSetting();
	}
});
