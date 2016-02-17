Template.pushNotificationsFlexTab.helpers({
	"desktopNotifications"() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				desktopNotifications: 1
			}
		});
		return sub ? sub.desktopNotifications : '';
	},
	"mobilePushNotifications"() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				mobilePushNotifications: 1
			}
		});
		return sub ? sub.mobilePushNotifications : '';
	},
	"emailNotifications"() {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				emailNotifications: 1
			}
		});
		return sub ? sub.emailNotifications : '';
	},
	"subValue"(field) {
		var sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				[field]: 1
			}
		});
		if (sub) {
			switch (sub[field]) {
				case 'all':
					return TAPi18n.__('All_messages');
				case 'nothing':
					return TAPi18n.__('Nothing');
				default:
					return TAPi18n.__('Mentions');
			}
		}
	},
	"editing"(field) {
		return Template.instance().editing.get() === field;
	}
});

Template.pushNotificationsFlexTab.onCreated(function() {
	this.editing = new ReactiveVar();

	this.validateSetting = (field) => {
		const value = this.$('input[name='+ field +']:checked').val();
		if (['all', 'mentions', 'nothing'].indexOf(value) === -1) {
			toastr.error(TAPi18n.__('Invalid_notification_setting_s', value || ''));
			return false;
		}
		return true;
	};

	this.saveSetting = () => {
		const field = this.editing.get();
		const value = this.$('input[name='+ field +']:checked').val();
		if (this.validateSetting(field)) {
			Meteor.call('saveNotificationSettings', Session.get('openedRoom'), field, value, (err, result) => {
				if (err) {
					return toastr.error(TAPi18n.__(err.reason || err.message));
				}
			});
		}
		this.editing.set();
	};
});

Template.pushNotificationsFlexTab.events({
	'keydown input[type=text]'(e, instance) {
		if (e.keyCode === 13) {
			e.preventDefault();
			instance.saveSetting();
		}
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
