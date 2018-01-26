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
		return Template.instance().form.disableNotifications.get();
	},
	hideUnreadStatus() {
		return Template.instance().form.hideUnreadStatus.get();
	},
	audioNotifications() {
		return Template.instance().form.audioNotifications.get();
	},
	desktopNotifications() {
		return Template.instance().form.desktopNotifications.get();
	},
	mobilePushNotifications() {
		return Template.instance().form.mobilePushNotifications.get();
	},
	emailNotifications() {
		return Template.instance().form.emailNotifications.get();
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
	const rid = Session.get('openedRoom');
	const sub = ChatSubscription.findOne({rid}, {
		fields: {
			disableNotifications: 1,
			hideUnreadStatus: 1,
			audioNotifications: 1,
			desktopNotifications: 1,
			mobilePushNotifications: 1,
			emailNotifications: 1
		}
	}) || {};

	const {
		disableNotifications = false,
		hideUnreadStatus = false,
		audioNotifications = 'default',
		desktopNotifications = 'default',
		mobilePushNotifications = 'default',
		emailNotifications = ''
	} = sub;

	this.original = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications)
	};

	this.form = {
		disableNotifications: new ReactiveVar(disableNotifications),
		hideUnreadStatus: new ReactiveVar(hideUnreadStatus),
		audioNotifications: new ReactiveVar(audioNotifications),
		desktopNotifications: new ReactiveVar(desktopNotifications),
		mobilePushNotifications: new ReactiveVar(mobilePushNotifications),
		emailNotifications: new ReactiveVar(emailNotifications)
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
	'click .cancel'(e, instance) {
		e.preventDefault();
		Object.keys(instance.original).forEach(key =>
			instance.form[key].set(instance.original[key])
		);
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
		instance.form[$(e.currentTarget).attr('name')].set(e.value);
	},

	'click .rc-user-info__config-value'(e) {
		const instance = Template.instance();
		const key = this.valueOf();

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
				change : (value) => {
					return instance.form[key].set(value);
				},
				value: instance.form[key].get(),
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



Template.pushNotificationsPopover.onCreated(function() {
	this.change = this.data.change;
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
