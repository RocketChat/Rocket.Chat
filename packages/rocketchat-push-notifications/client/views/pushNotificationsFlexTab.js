import toastr from 'toastr';
import moment from 'moment';
/* globals ChatSubscription */

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing'
};

function getUserPreference(preference) {
	const user = Meteor.user();
	return user && user.settings && user.settings.preferences && user.settings.preferences[preference];
}

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
		return sub ? sub.disableNotifications || false : false;
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
	doNotDisturb() {
		return Template.instance().doNotDisturb.get();
	},
	doNotDisturbIsValid() {
		const doNotDisturb = Template.instance().doNotDisturb.get();
		return !!(doNotDisturb && doNotDisturb.initialTime && doNotDisturb.finalTime && (doNotDisturb.repeatFor === 'every day' || moment().isBefore(doNotDisturb.limitDateTime)));
	},
	doNotDisturbInfo() {
		const { initialTime, finalTime, limitDateTime } = Template.instance().doNotDisturb.get();
		let { repeatFor } = Template.instance().doNotDisturb.get();

		switch (repeatFor) {
			case '1 day': repeatFor = t('Do_Not_Disturb_Repeat_For_1_Day_Option'); break;
			case '1 week': repeatFor = t('Do_Not_Disturb_Repeat_For_1_Week_Option'); break;
			case '1 month': repeatFor = t('Do_Not_Disturb_Repeat_For_1_Month_Option'); break;
			case '1 year': repeatFor = t('Do_Not_Disturb_Repeat_For_1_Year_Option'); break;
			case 'every day': repeatFor = t('Do_Not_Disturb_Repeat_For_Every_Day_Option');
		}

		return {
			initialTime,
			finalTime,
			repeatFor,
			limitDateTime: limitDateTime ? moment(limitDateTime).format('ll') : undefined
		};
	},
	snoozeNotifications() {
		return Template.instance().snoozeNotifications.get();
	},
	snoozeNotificationsInfo() {
		const { initialDateTime, finalDateTime } = Template.instance().snoozeNotifications.get();
		let { duration } = Template.instance().snoozeNotifications.get();

		if (duration === 20) {
			duration = t('Snooze_Notifications_20_Minutes_Option');
		} else if (duration === 60) {
			duration = t('Snooze_Notifications_1_Hour_Option');
		} else {
			duration = t(`Snooze_Notifications_${ (duration/60) }_Hours_Option`);
		}

		return {
			description: duration,
			from: moment(initialDateTime).format('lll'),
			to: moment(finalDateTime).format('lll')
		};
	},
	snoozeNotificationsIsValid() {
		const snoozeNotifications = Template.instance().snoozeNotifications.get();
		return snoozeNotifications && snoozeNotifications.finalDateTime && moment().isBefore(snoozeNotifications.finalDateTime);
	},
	selectHoursOptions() {
		let hour = moment('00:00', 'HH:mm');
		const hours = [];

		while (hour.isBefore(moment('23:59', 'HH:mm'))) {
			hours.push(hour.format('HH:mm'));
			hour = hour.add(30, 'minutes');
		}

		return hours;
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
		let preference = getUserPreference('audioNotifications');
		if (preference === 'default' || preference == null) {
			preference = RocketChat.settings.get('Audio_Notifications_Default_Alert');
		}
		return notificationLabels[preference];
	},
	defaultDesktopNotification() {
		let preference = getUserPreference('desktopNotifications');
		if (preference === 'default' || preference == null) {
			preference = RocketChat.settings.get('Desktop_Notifications_Default_Alert');
		}
		return notificationLabels[preference];
	},
	defaultMobileNotification() {
		let preference = getUserPreference('mobileNotifications');
		if (preference === 'default' || preference == null) {
			preference = RocketChat.settings.get('Mobile_Notifications_Default_Alert');
		}
		return notificationLabels[preference];
	}
});

Template.pushNotificationsFlexTab.onCreated(function() {
	this.editing = new ReactiveVar();
	this.doNotDisturb = new ReactiveVar({});
	this.snoozeNotifications = new ReactiveVar({});

	Meteor.autorun(() => {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				doNotDisturb: 1,
				snoozeNotifications: 1
			}
		});

		if (sub && sub.doNotDisturb) {
			this.doNotDisturb.set(sub.doNotDisturb);
		}

		if (sub && sub.snoozeNotifications) {
			this.snoozeNotifications.set(sub.snoozeNotifications);
		}
	});

	this.validateSetting = (field) => {
		switch (field) {
			case 'audioNotificationValue':
				return true;
			case 'snoozeNotifications':
				return true;
			case 'doNotDisturb':
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

	this.saveSetting = () => {
		const field = this.editing.get();
		let value;
		switch (field) {
			case 'snoozeNotifications':
				value = this.$(`input[name=${ field }]:checked`).val();
				break;
			case 'doNotDisturb':
				value = this.$(`input[name=${ field }]:checked`).val();
				break;
			case 'hideUnreadStatus':
			case 'disableNotifications':
				value = this.$(`input[name=${ field }]:checked`).val() ? '1' : '0';
				break;
			default:
				value = this.$(`input[name=${ field }]:checked`).val();
				break;
		}

		const soundVal = $('select[name=audioNotificationValue]').val();
		const duration = $('input[name=duration]').val();

		if (field === 'doNotDisturb' || field === 'snoozeNotifications') {
			if (value && value === '1') {
				if (field === 'doNotDisturb') {
					value = {
						initialTime: $('select[name=doNotDisturbInitialTime]').val() || '00:00',
						finalTime: $('select[name=doNotDisturbFinalTime]').val() || '08:00',
						repeatFor: $('select[name=doNotDisturbRepeatFor]').val() || 'every day'
					};

					if (value.repeatFor && value.repeatFor !== '') {
						const addLimitDateTime = (durationValue, durationType) => {
							return value.limitDateTime = moment(`${ moment().format('YYYY-MM-DD') } ${ value.finalTime }`, 'YYYY-MM-DD HH:mm').add(durationValue, durationType).toDate();
						};

						switch (value.repeatFor) {
							case '1 day': addLimitDateTime(1, 'day'); break;
							case '1 week': addLimitDateTime(1, 'week'); break;
							case '1 month': addLimitDateTime(1, 'month'); break;
							case '1 year': addLimitDateTime(1, 'year'); break;
							case 'every day': value.limitDateTime = undefined;
						}
					}
				} else if (field === 'snoozeNotifications') {
					const snoozeDuration = parseInt($('input[name=snoozeNotificationsOptions]:checked').val() || 120);
					const initialDateTime = new Date();

					if (snoozeDuration && snoozeDuration > 0) {
						value = {
							duration: snoozeDuration,
							initialDateTime,
							finalDateTime: (moment(initialDateTime).add(snoozeDuration, 'minutes')).toDate()
						};
					} else {
						value = {};
					}
				}
			} else {
				value = {};
			}
		}

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
			audio = user && user.settings && user.settings.preferences && user.settings.preferences.newMessageNotification || 'chime';
		}

		if (audio && audio !== 'none') {
			const audioVolume = user && user.settings && user.settings.preferences && user.settings.preferences.notificationsSoundVolume || 100;
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
			audio = user && user.settings && user.settings.preferences && user.settings.preferences.newMessageNotification || 'chime';
		}
		if (audio && audio !== 'none') {
			const audioVolume = user && user.settings && user.settings.preferences && user.settings.preferences.notificationsSoundVolume || 100;
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
		instance.saveSetting();
	}
});
