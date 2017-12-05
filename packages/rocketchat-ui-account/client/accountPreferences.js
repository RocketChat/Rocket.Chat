/*globals defaultUserLanguage, KonchatNotification */
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing'
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
		const propertyeExists = !!(user && user.settings && user.settings.preferences && user.settings.preferences[property]);
		let currentValue;
		if (propertyeExists) {
			currentValue = !!user.settings.preferences[property];
		} else if (!propertyeExists && defaultValue === true) {
			currentValue = value;
		}
		return currentValue === value;
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
		return user && user.settings && user.settings.preferences && user.settings.preferences['highlights'] && user.settings.preferences['highlights'].join(', ');
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
	this.save = function() {
		instance = this;
		const data = {};
		let reload = false;
		const selectedLanguage = $('#language').val();
		if (localStorage.getItem('userLanguage') !== selectedLanguage) {
			localStorage.setItem('userLanguage', selectedLanguage);
			data.language = selectedLanguage;
			reload = true;
		}
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
		data.highlights = _.compact(_.map($('[name=highlights]').val().split(','), function(e) {
			return s.trim(e);
		}));
		data.desktopNotificationDuration = $('input[name=desktopNotificationDuration]').val();
		data.desktopNotifications = $('#desktopNotifications').find('select').val();
		data.mobileNotifications = $('#mobileNotifications').find('select').val();
		data.unreadAlert = $('#unreadAlert').find('input:checked').val();
		data.notificationsSoundVolume = parseInt($('#notificationsSoundVolume').val());

		data.roomCounterSidebar = $('#roomCounterSidebar').find('input:checked').val();

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
	}
});
