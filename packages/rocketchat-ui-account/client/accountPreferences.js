/*globals defaultUserLanguage, KonchatNotification */
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';
import moment from 'moment';

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing'
};

const DEFAULT_IDLE_TIME_LIMIT = 300000;

const userHasPreferences = (user) => {
	const userHasSettings = user.hasOwnProperty('settings');

	if (!userHasSettings) {
		return false;
	}

	return user.settings.hasOwnProperty('preferences');
};

Template.accountPreferences.helpers({
	showMergedChannels() {
		return ['category', 'unread'].includes(Template.instance().roomsListExhibitionMode.get()) ? '' : 'disabled';
	},
	audioAssets() {
		return (RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList()) || [];
	},
	newMessageNotification() {
		const user = Meteor.user();
		return (user && user.settings && user.settings.preferences && user.settings.preferences.newMessageNotification) || 'chime';
	},
	newRoomNotification() {
		const user = Meteor.user();
		return (user && user.settings && user.settings.preferences && user.settings.preferences.newRoomNotification) || 'door';
	},
	languages() {
		const languages = TAPi18n.getLanguages();

		const result = Object.keys(languages).map((key) => {
			const language = languages[key];
			return _.extend(language, { key });
		});

		return _.sortBy(result, 'key');
	},
	userLanguage(key) {
		const user = Meteor.user();
		let result = undefined;
		if (user.language) {
			result = user.language === key;
		} else if (defaultUserLanguage()) {
			result = defaultUserLanguage() === key;
		}
		return result;
	},
	checked(property, value, defaultValue) {
		const user = Meteor.user();

		if (!userHasPreferences(user)) {
			return defaultValue;
		}

		const userPreferences = user.settings.preferences;

		if (userPreferences.hasOwnProperty(property)) {
			return value === userPreferences[property];
		}

		return defaultValue;
	},
	selected(property, value, defaultValue) {
		const user = Meteor.user();
		const propertyeExists = !!(user && user.settings && user.settings.preferences && user.settings.preferences[property]);
		if (propertyeExists) {
			return user.settings.preferences[property] === value;
		} else {
			return defaultValue === true;
		}
	},
	highlights() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences['highlights'] && user.settings.preferences['highlights'].join('\n');
	},
	desktopNotificationEnabled() {
		return KonchatNotification.notificationStatus.get() === 'granted' || (window.Notification && Notification.permission === 'granted');
	},
	desktopNotificationDisabled() {
		return KonchatNotification.notificationStatus.get() === 'denied' || (window.Notification && Notification.permission === 'denied');
	},
	defaultAudioNotification() {
		return notificationLabels[RocketChat.settings.get('Audio_Notifications_Default_Alert')];
	},
	defaultAudioNotificationValue() {
		return RocketChat.settings.get('Audio_Notifications_Value');
	},
	desktopNotificationDuration() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.desktopNotificationDuration;
	},
	defaultDesktopNotificationDuration() {
		return RocketChat.settings.get('Desktop_Notifications_Duration');
	},
	idleTimeLimit() {
		const user = Meteor.user();
		return (user && user.settings && user.settings.preferences && user.settings.preferences.idleTimeLimit) || DEFAULT_IDLE_TIME_LIMIT;
	},
	defaultIdleTimeLimit() {
		return DEFAULT_IDLE_TIME_LIMIT;
	},
	defaultDesktopNotification() {
		return notificationLabels[RocketChat.settings.get('Desktop_Notifications_Default_Alert')];
	},
	defaultMobileNotification() {
		return notificationLabels[RocketChat.settings.get('Mobile_Notifications_Default_Alert')];
	},
	showRoles() {
		return RocketChat.settings.get('UI_DisplayRoles');
	},
	notificationsSoundVolume() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.notificationsSoundVolume || 100;
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
	showDoNotDisturbOptions() {
		return Template.instance().showDoNotDisturbOptions.get();
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
		return !!(snoozeNotifications && snoozeNotifications.finalDateTime && moment().isBefore(snoozeNotifications.finalDateTime));
	},
	showSnoozeNotificationsOptions() {
		return Template.instance().showSnoozeNotificationsOptions.get();
	},
	selectHoursOptions() {
		let hour = moment('00:00', 'HH:mm');
		const hours = [];

		while (hour.isBefore(moment('23:59', 'HH:mm'))) {
			hours.push(hour.format('HH:mm'));
			hour = hour.add(30, 'minutes');
		}

		return hours;
	}
});

Template.accountPreferences.onCreated(function() {
	const user = Meteor.user();
	const settingsTemplate = this.parentTemplate(3);

	if (settingsTemplate.child == null) {
		settingsTemplate.child = [];
	}

	settingsTemplate.child.push(this);

	if (user && user.settings && user.settings.preferences) {
		this.roomsListExhibitionMode = new ReactiveVar(user.settings.preferences.roomsListExhibitionMode || 'category');
		this.useEmojis = new ReactiveVar(user.settings.preferences.desktopNotificationDuration == null || user.settings.preferences.useEmojis);
	} else {
		this.roomsListExhibitionMode = new ReactiveVar('category');
	}

	let instance = this;

	this.autorun(() => {
		if (instance.useEmojis && instance.useEmojis.get()) {
			Tracker.afterFlush(() => $('#convertAsciiEmoji').show());
		} else {
			Tracker.afterFlush(() => $('#convertAsciiEmoji').hide());
		}
	});

	this.clearForm = function() {
		this.find('#language').value = localStorage.getItem('userLanguage');
	};

	this.doNotDisturb = new ReactiveVar(user && user.settings && user.settings.preferences && user.settings.preferences.doNotDisturb);
	this.snoozeNotifications = new ReactiveVar(user && user.settings && user.settings.preferences && user.settings.preferences.snoozeNotifications);

	this.showDoNotDisturbOptions = new ReactiveVar(false);
	this.showSnoozeNotificationsOptions = new ReactiveVar(false);

	if (this.doNotDisturb.get() && this.doNotDisturb.get().initialTime) {
		this.showDoNotDisturbOptions.set(true);
	}

	if (this.snoozeNotifications.get() && this.snoozeNotifications.get().finalDateTime && moment().isBefore(this.snoozeNotifications.get().finalDateTime)) {
		this.showSnoozeNotificationsOptions.set(true);
	}

	this.shouldUpdateLocalStorageSetting = function(setting, newValue) {
		return localStorage.getItem(setting) !== newValue;
	};

	this.save = function() {
		instance = this;
		const data = {};

		data.newRoomNotification = $('select[name=newRoomNotification]').val();
		data.newMessageNotification = $('select[name=newMessageNotification]').val();
		data.useEmojis = $('input[name=useEmojis]:checked').val();
		data.convertAsciiEmoji = $('input[name=convertAsciiEmoji]:checked').val();
		data.saveMobileBandwidth = $('input[name=saveMobileBandwidth]:checked').val();
		data.collapseMediaByDefault = $('input[name=collapseMediaByDefault]:checked').val();
		data.viewMode = parseInt($('#viewMode').find('select').val());
		data.hideUsernames = $('#hideUsernames').find('input:checked').val();
		data.hideRoles = $('#hideRoles').find('input:checked').val();
		data.hideFlexTab = $('#hideFlexTab').find('input:checked').val();
		data.hideAvatars = $('#hideAvatars').find('input:checked').val();
		data.mergeChannels = $('#mergeChannels').find('input:checked').val();
		data.sendOnEnter = $('#sendOnEnter').find('select').val();
		data.unreadRoomsMode = $('input[name=unreadRoomsMode]:checked').val();
		data.roomsListExhibitionMode = $('select[name=roomsListExhibitionMode]').val();
		data.autoImageLoad = $('input[name=autoImageLoad]:checked').val();
		data.emailNotificationMode = $('select[name=emailNotificationMode]').val();
		data.desktopNotificationDuration = $('input[name=desktopNotificationDuration]').val();
		data.desktopNotifications = $('#desktopNotifications').find('select').val();
		data.mobileNotifications = $('#mobileNotifications').find('select').val();
		data.unreadAlert = $('#unreadAlert').find('input:checked').val();
		data.notificationsSoundVolume = parseInt($('#notificationsSoundVolume').val());
		data.roomCounterSidebar = $('#roomCounterSidebar').find('input:checked').val();
		data.highlights = _.compact(_.map($('[name=highlights]').val().split('\n'), function(e) {
			return s.trim(e);
		}));

		const selectedLanguage = $('#language').val();
		const enableAutoAway = $('#enableAutoAway').find('input:checked').val();
		const idleTimeLimit = parseInt($('input[name=idleTimeLimit]').val());

		data.enableAutoAway = enableAutoAway;
		data.idleTimeLimit = idleTimeLimit;

		let reload = false;

		// if highlights changed we need page reload
		const user = Meteor.user();
		if (user &&
			user.settings &&
			user.settings.preferences &&
			user.settings.preferences['highlights'] &&
			user.settings.preferences['highlights'].join('\n') !== data.highlights.join('\n')) {
			reload = true;
		}


		if (this.shouldUpdateLocalStorageSetting('userLanguage', selectedLanguage)) {
			localStorage.setItem('userLanguage', selectedLanguage);
			data.language = selectedLanguage;
			reload = true;
		}

		if (this.shouldUpdateLocalStorageSetting('enableAutoAway', enableAutoAway)) {
			localStorage.setItem('enableAutoAway', enableAutoAway);
			reload = true;
		}

		if (this.shouldUpdateLocalStorageSetting('idleTimeLimit', idleTimeLimit)) {
			localStorage.setItem('idleTimeLimit', idleTimeLimit);
			reload = true;
		}

		if ($('input[name=snoozeNotifications]:checked').val() === '1') {
			data.snoozeNotificationsDuration = parseInt($('input[name=snoozeNotificationsDuration]:checked').val() || 0);
		}

		if ($('input[name=doNotDisturb]:checked').val() === '1' && $('select[name=doNotDisturbInitialTime]').val() !== $('select[name=doNotDisturbFinalTime]').val()) {
			data.doNotDisturbInitialTime = $('select[name=doNotDisturbInitialTime]').val();
			data.doNotDisturbFinalTime = $('select[name=doNotDisturbFinalTime]').val();
			data.doNotDisturbRepeatFor = $('select[name=doNotDisturbRepeatFor]').val();
		}

		Meteor.call('saveUserPreferences', data, function(error, results) {
			if (results) {
				toastr.success(t('Preferences_saved'));
				instance.clearForm();
				if (reload) {
					setTimeout(function() {
						Meteor._reload.reload();
					}, 1000);
				}
			}
			if (error) {
				return handleError(error);
			}
		});
	};
});

Template.accountPreferences.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

Template.accountPreferences.events({
	'click .submit button'(e, t) {
		t.save();
	},
	'change input[name=useEmojis]'(e, t) {
		t.useEmojis.set($(e.currentTarget).val() === '1');
	},
	'click .enable-notifications'() {
		KonchatNotification.getDesktopPermission();
	},
	'click .test-notifications'() {
		KonchatNotification.notify({
			duration: $('input[name=desktopNotificationDuration]').val(),
			payload: { sender: { username: 'rocket.cat' }
			},
			title: TAPi18n.__('Desktop_Notification_Test'),
			text: TAPi18n.__('This_is_a_desktop_notification')
		});
	},
	'change [name=roomsListExhibitionMode]'(e, instance) {
		const value = $(e.currentTarget).val();
		instance.roomsListExhibitionMode.set(value);
	},
	'change .audio'(e) {
		e.preventDefault();
		const audio = $(e.currentTarget).val();
		if (audio === 'none') {
			return;
		}
		if (audio) {
			const $audio = $(`audio#${ audio }`);
			return $audio && $audio[0] && $audio.play();
		}
	},
	'change input[name=doNotDisturb]'(e, instance) {
		e.preventDefault();
		instance.showDoNotDisturbOptions.set(!instance.showDoNotDisturbOptions.get());
	},
	'change input[name=snoozeNotifications]'(e, instance) {
		e.preventDefault();
		instance.showSnoozeNotificationsOptions.set(!instance.showSnoozeNotificationsOptions.get());
	}
});
