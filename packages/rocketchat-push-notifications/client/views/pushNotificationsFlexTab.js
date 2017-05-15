import toastr from 'toastr';
/* globals ChatSubscription */

Template.pushNotificationsFlexTab.helpers({
	audioAssets() {
		return RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList() || [];
	},
	audioNotification() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				audioNotification: 1
			}
		});
		return sub ? sub.audioNotification || '' : '';
	},
	desktopNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				desktopNotifications: 1
			}
		});
		return sub ? sub.desktopNotifications : '';
	},
	mobilePushNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				mobilePushNotifications: 1
			}
		});
		return sub ? sub.mobilePushNotifications : '';
	},
	emailNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				emailNotifications: 1
			}
		});
		return sub ? sub.emailNotifications : '';
	},
	showEmailMentions() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				t: 1
			}
		});
		return sub && sub.t !== 'd';
	},
	unreadAlert() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				unreadAlert: 1
			}
		});
		return sub ? sub.unreadAlert : 'default';
	},
	unreadAlertText() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				unreadAlert: 1
			}
		});
		if (sub) {
			switch (sub.unreadAlert) {
				case 'all':
					return t('On');
				case 'nothing':
					return t('Off');
			}
		}
		return t('Use_account_preference');
	},
	audioValue() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				audioNotification: 1
			}
		});
		const audio = sub ? sub.audioNotification || '': '';
		if (audio === 'none') {
			return t('None');
		} else if (audio === '') {
			return t('Use_account_preference');
		} else if (audio === 'chime') {
			return 'Chime';
		} else {
			const audioAssets = RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList() || [];
			const asset = _.findWhere(audioAssets, { _id: audio });
			return asset && asset.name;
		}
	},
	subValue(field) {
		const sub = ChatSubscription.findOne({
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
		// Convert to Number
		return sub.desktopNotificationDuration - 0;
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
		switch (field) {
			case 'audioNotification':
				return true;
			default:
				const value = this.$(`input[name=${ field }]:checked`).val();
				if (['all', 'mentions', 'nothing', 'default'].indexOf(value) === -1) {
					toastr.error(t('Invalid_notification_setting_s', value || ''));
					return false;
				}
				return true;
		}
	};

	this.saveSetting = () => {
		const field = this.editing.get();
		let value;
		switch (field) {
			case 'audioNotification':
				value = this.$(`select[name=${ field }]`).val();
				break;
			default:
				value = this.$(`input[name=${ field }]:checked`).val();
				break;
		}
		const duration = $('input[name=duration]').val();
		if (this.validateSetting(field)) {
			Meteor.call('saveNotificationSettings', Session.get('openedRoom'), field, value, (err/*, result*/) => {
				if (err) {
					return handleError(err);
				}
				if (duration !== undefined) {
					Meteor.call('saveDesktopNotificationDuration', Session.get('openedRoom'), duration, (err) => {
						if (err) {
							return handleError(err);
						}
						this.editing.set();
					});
				} else {
					this.editing.set();
				}
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
	},

	'click [data-play]'(e) {
		e.preventDefault();
		let audio = $(e.currentTarget).data('play');
		if (audio && audio !== 'none') {
			const $audio = $(`audio#${ audio }`);
			if ($audio && $audio[0] && $audio[0].play) {
				$audio[0].play();
			}
		} else {
			audio = Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.newMessageNotification || 'chime';
			if (audio && audio !== 'none') {
				const $audio = $(`audio#${ audio }`);
				if ($audio && $audio[0] && $audio[0].play) {
					$audio[0].play();
				}
			}
		}
	},

	'change select[name=audioNotification]'(e) {
		e.preventDefault();
		const audio = $(e.currentTarget).val();
		if (audio && audio !== 'none') {
			const $audio = $(`audio#${ audio }`);
			if ($audio && $audio[0] && $audio[0].play) {
				$audio[0].play();
			}
		}
	}
});
