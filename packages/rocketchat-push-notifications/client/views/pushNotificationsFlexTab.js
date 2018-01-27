import toastr from 'toastr';
/* globals ChatSubscription popover */

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing'
};

Template.pushNotificationsFlexTab.helpers({
	audioAssets() {
		return RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList() || [];
	},
	disableNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				disableNotifications: 1
			}
		});
		return sub && sub.disableNotifications;
	},
	hideUnreadStatus() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				hideUnreadStatus: 1
			}
		});
		return sub ? sub.hideUnreadStatus || false : false;
	},
	audioNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				audioNotifications: 1
			}
		});
		return sub ? sub.audioNotifications || 'default' : 'default';
	},
	desktopNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				desktopNotifications: 1
			}
		});
		return sub ? sub.desktopNotifications || 'default' : 'default';
	},
	mobilePushNotifications() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				mobilePushNotifications: 1
			}
		});
		return sub ? sub.mobilePushNotifications || 'default' : 'default';
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
					return t('Use_account_preference');
			}
		}
	},
	audioNotificationValue() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				audioNotificationValue: 1
			}
		});
		const audio = sub ? sub.audioNotificationValue || 'default' : 'default';
		if (audio === 'default') {
			return t('Use_account_preference');
		}
		return audio;
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
	},
	defaultAudioNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'audioNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_audioNotifications');
		}
		return notificationLabels[preference];
	},
	defaultDesktopNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'desktopNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications');
		}
		return notificationLabels[preference];
	},
	defaultMobileNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'mobileNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_mobileNotifications');
		}
		return notificationLabels[preference];
	}
});

Template.pushNotificationsFlexTab.onCreated(function() {
	this.editing = new ReactiveVar();

	this.validateSetting = (field) => {
		switch (field) {
			case 'audioNotificationValue':
				return true;
			case 'hideUnreadStatus':
			case 'disableNotifications':
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

	this.saveSetting = (field) => {
		field = field || this.editing.get();
		let value;
		switch (field) {
			case 'hideUnreadStatus':
			case 'disableNotifications':
				value = this.$(`input[name=${ field }]`)[0].checked ? '1' : '0';
				break;
			default:
				value = this.$(`input[name=${ field }]:checked`).val();
				break;
		}
		const soundVal = $('select').val();
		const duration = $('input[name=duration]').val();
		if (this.validateSetting(field)) {
			Meteor.call('saveNotificationSettings', Session.get('openedRoom'), field, value, (err/*, result*/) => {
				if (err) {
					return handleError(err);
				} else if (duration !== undefined) {
					Meteor.call('saveDesktopNotificationDuration', Session.get('openedRoom'), duration, (err) => {
						if (err) {
							return handleError(err);
						}
					});
				} else if (soundVal!==undefined) {
					Meteor.call('saveAudioNotificationValue', Session.get('openedRoom'), soundVal, (err) => {
						if (err) {
							return handleError(err);
						}
					});
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
		const user = Meteor.user();

		if (audio === 'Use account preference' || audio === 'none') {
			audio = RocketChat.getUserPreference(user, 'newMessageNotification');
		}

		if (audio && audio !== 'none') {
			const audioVolume = RocketChat.getUserPreference(user, 'notificationsSoundVolume');
			const $audio = $(`audio#${ audio }`);

			if ($audio && $audio[0] && $audio[0].play) {
				$audio[0].volume = Number((audioVolume/100).toPrecision(2));
				$audio[0].play();
			}
		}
	},

	'change select[name=audioNotificationValue]'(e) {
		e.preventDefault();

		let audio = $(e.currentTarget).val();
		const user = Meteor.user();

		if (audio==='') {
			audio = RocketChat.getUserPreference(user, 'newMessageNotification');
		}
		if (audio && audio !== 'none') {
			const audioVolume = RocketChat.getUserPreference(user, 'notificationsSoundVolume');
			const $audio = $(`audio#${ audio }`);

			if ($audio && $audio[0] && $audio[0].play) {
				$audio[0].volume = Number((audioVolume/100).toPrecision(2));
				$audio[0].play();
			}
		}
	},

	'change input[type=checkbox]'(e, instance) {
		e.preventDefault();
		instance.editing.set($(e.currentTarget).attr('name'));
		instance.saveSetting($(e.currentTarget).attr('name'));
	},

	'click .rc-user-info__config-value'(e) {
		const config = {
			popoverClass: 'notifications-preferences',
			template: 'pushNotificationsPopover',
			mousePosition: () => ({
				x: e.currentTarget.getBoundingClientRect().left,
				y: e.currentTarget.getBoundingClientRect().bottom + 50
			}),
			customCSSProperties: () => ({
				top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
				left: `${ e.currentTarget.getBoundingClientRect().left - 10 }px`
			}),
			data: {
				value: 'default',
				options : [{
					id: 'desktopNotificationsDefault',
					name: 'desktopNotifications',
					label: 'Default',
					value: 'default'
				},
				{
					id: 'desktopNotificationsAll_messages',
					name: 'desktopNotifications',
					label: 'All_messages',
					value: 'all'
				},
				{
					id: 'desktopNotificationsMentions',
					name: 'desktopNotifications',
					label: 'Mentions',
					value: 'mentions'
				},
				{
					id: 'desktopNotificationsNothing',
					name: 'desktopNotifications',
					label: 'Nothing',
					value: 'nothing'
				}]
			}
		};
		popover.open(config);
	}
});


Template.pushNotificationsPopover.onRendered(function() {
	this.find(`[value=${ this.data.value }]`).checked = true;
});

Template.pushNotificationsPopover.helpers({
	options() {
		return Template.instance().data.options;
	},
	defaultDesktopNotification() {
		let preference = RocketChat.getUserPreference(Meteor.user(), 'desktopNotifications');
		if (preference === 'default') {
			preference = RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications');
		}
		return notificationLabels[preference];
	}
});
Template.pushNotificationsPopover.events({
	'change input'(e, instance) {
		instance.change && instance.change(e.target.value);
	}
});
