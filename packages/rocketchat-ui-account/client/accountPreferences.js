import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Reload } from 'meteor/reload';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat, handleError } from 'meteor/rocketchat:lib';
import { modal, SideNav, KonchatNotification } from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

const notificationLabels = {
	all: 'All_messages',
	mentions: 'Mentions',
	nothing: 'Nothing',
};

const emailLabels = {
	nothing: 'Email_Notification_Mode_Disabled',
	mentions: 'Email_Notification_Mode_All',
};

function checkedSelected(property, value, defaultValue = undefined) {
	if (defaultValue && defaultValue.hash) {
		defaultValue = undefined;
	}
	return RocketChat.getUserPreference(Meteor.userId(), property, defaultValue) === value;
}

Template.accountPreferences.helpers({
	audioAssets() {
		return (RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList()) || [];
	},
	newMessageNotification() {
		return RocketChat.getUserPreference(Meteor.userId(), 'newMessageNotification');
	},
	newRoomNotification() {
		return RocketChat.getUserPreference(Meteor.userId(), 'newRoomNotification');
	},
	muteFocusedConversations() {
		return RocketChat.getUserPreference(Meteor.userId(), 'muteFocusedConversations');
	},
	languages() {
		const languages = TAPi18n.getLanguages();

		const result = Object.entries(languages)
			.map(([key, language]) => ({ ...language, key: key.toLowerCase() }))
			.sort((a, b) => a.key - b.key);

		result.unshift({
			name: 'Default',
			en: 'Default',
			key: '',
		});

		return result;
	},
	isUserLanguage(key) {
		const languageKey = Meteor.user().language;
		return typeof languageKey === 'string' && languageKey.toLowerCase() === key;
	},
	checked(property, value, defaultValue = undefined) {
		return checkedSelected(property, value, defaultValue);
	},
	selected(property, value, defaultValue = undefined) {
		return checkedSelected(property, value, defaultValue);
	},
	highlights() {
		const userHighlights = RocketChat.getUserPreference(Meteor.userId(), 'highlights');
		return userHighlights ? userHighlights.join(',\n') : undefined;
	},
	desktopNotificationEnabled() {
		return KonchatNotification.notificationStatus.get() === 'granted' || (window.Notification && Notification.permission === 'granted');
	},
	desktopNotificationDisabled() {
		return KonchatNotification.notificationStatus.get() === 'denied' || (window.Notification && Notification.permission === 'denied');
	},
	desktopNotificationDuration() {
		const userPref = RocketChat.getUserPreference(Meteor.userId(), 'desktopNotificationDuration', 'undefined');
		return userPref !== 'undefined' ? userPref : undefined;
	},
	defaultDesktopNotificationDuration() {
		return RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotificationDuration');
	},
	idleTimeLimit() {
		return RocketChat.getUserPreference(Meteor.userId(), 'idleTimeLimit');
	},
	defaultIdleTimeLimit() {
		return RocketChat.settings.get('Accounts_Default_User_Preferences_idleTimeLimit');
	},
	defaultDesktopNotification() {
		return notificationLabels[RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications')];
	},
	defaultMobileNotification() {
		return notificationLabels[RocketChat.settings.get('Accounts_Default_User_Preferences_mobileNotifications')];
	},
	defaultEmailNotification() {
		return emailLabels[RocketChat.settings.get('Accounts_Default_User_Preferences_emailNotificationMode')];
	},
	showRoles() {
		return RocketChat.settings.get('UI_DisplayRoles');
	},
	notificationsSoundVolume() {
		return RocketChat.getUserPreference(Meteor.userId(), 'notificationsSoundVolume');
	},
	dontAskAgainList() {
		return RocketChat.getUserPreference(Meteor.userId(), 'dontAskAgainList');
	},
	showLocalization() {
		return RocketChat.settings.get('UI_DisplayLocalization');
	},
	showPrivacy() {
		return RocketChat.settings.get('UI_DisplayPrivacy');
	},
	showUserPresence() {
		return RocketChat.settings.get('UI_DisplayUserPresence');
	},
	showNotifications() {
		return RocketChat.settings.get('UI_DisplayNotifications');
	},
	showMessages() {
		return RocketChat.settings.get('UI_DisplayMessages');
	},
	showSidebar() {
		return RocketChat.settings.get('UI_DisplaySidebar');
	},
	showHighlights() {
		return RocketChat.settings.get('UI_DisplayHighlights');
	},
	showSound() {
		return RocketChat.settings.get('UI_DisplaySound');
	},
	showMyData() {
		return (RocketChat.settings.get('UserData_EnableDownload') !== false) && RocketChat.settings.get('UI_DisplayMyData');
	},
});

Template.accountPreferences.onCreated(function() {
	const settingsTemplate = this.parentTemplate(3);

	if (settingsTemplate.child == null) {
		settingsTemplate.child = [];
	}

	settingsTemplate.child.push(this);

	this.useEmojis = new ReactiveVar(RocketChat.getUserPreference(Meteor.userId(), 'useEmojis'));

	let instance = this;

	if (RocketChat.settings.get('UI_DisplayMessages')) {
		this.autorun(() => {
			if (instance.useEmojis && instance.useEmojis.get()) {
				Tracker.afterFlush(() => $('#convertAsciiEmoji').show());
			} else {
				Tracker.afterFlush(() => $('#convertAsciiEmoji').hide());
			}
		});
	}

	this.clearForm = function() {
		if (RocketChat.settings.get('UI_DisplayLocalization')) {
			this.find('#language').value = localStorage.getItem('userLanguage');
		}
	};

	this.shouldUpdateLocalStorageSetting = function(setting, newValue) {
		return localStorage.getItem(setting) !== newValue;
	};

	this.save = function() {
		instance = this;
		const data = {};
		let reload = false;

		if (RocketChat.settings.get('UI_DisplayLocalization')) {
			const selectedLanguage = $('#language').val();
			if (this.shouldUpdateLocalStorageSetting('userLanguage', selectedLanguage)) {
				localStorage.setItem('userLanguage', selectedLanguage);
				data.language = selectedLanguage;
				reload = true;
			}
		}

		if (RocketChat.settings.get('UI_DisplayPrivacy')) {
			data.dontAskAgainList = Array.from(document.getElementById('dont-ask').options).map((option) => ({ action: option.value, label: option.text }));
			data.discoverability = $('#discoverability').find('input:checked').val();
		}

		if (RocketChat.settings.get('UI_DisplayUserPresence')) {
			const enableAutoAway = JSON.parse($('#enableAutoAway').find('input:checked').val());
			data.enableAutoAway = enableAutoAway;
			if (this.shouldUpdateLocalStorageSetting('enableAutoAway', enableAutoAway)) {
				localStorage.setItem('enableAutoAway', enableAutoAway);
				reload = true;
			}

			const idleTimeLimit = $('input[name=idleTimeLimit]').val() === '' ? RocketChat.settings.get('Accounts_Default_User_Preferences_idleTimeLimit') : parseInt($('input[name=idleTimeLimit]').val());
			data.idleTimeLimit = idleTimeLimit;
			if (this.shouldUpdateLocalStorageSetting('idleTimeLimit', idleTimeLimit)) {
				localStorage.setItem('idleTimeLimit', idleTimeLimit);
				reload = true;
			}
		}

		if (RocketChat.settings.get('UI_DisplayNotifications')) {
			data.desktopNotifications = $('#desktopNotifications').find('select').val();
			data.desktopNotificationDuration = $('input[name=desktopNotificationDuration]').val() === '' ? RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotificationDuration') : parseInt($('input[name=desktopNotificationDuration]').val());
			data.emailNotificationMode = $('select[name=emailNotificationMode]').val();
			data.mobileNotifications = $('#mobileNotifications').find('select').val();
		}

		if (RocketChat.settings.get('UI_DisplayMessages')) {
			data.unreadAlert = JSON.parse($('#unreadAlert').find('input:checked').val());
			data.clockMode = parseInt($('select[name=clockMode]').val());
			data.useEmojis = JSON.parse($('input[name=useEmojis]:checked').val());
			data.convertAsciiEmoji = JSON.parse($('input[name=convertAsciiEmoji]:checked').val());
			data.saveMobileBandwidth = JSON.parse($('input[name=saveMobileBandwidth]:checked').val());
			data.autoImageLoad = JSON.parse($('input[name=autoImageLoad]:checked').val());
			data.collapseMediaByDefault = JSON.parse($('input[name=collapseMediaByDefault]:checked').val());
			data.hideUsernames = JSON.parse($('#hideUsernames').find('input:checked').val());
			data.hideFlexTab = JSON.parse($('#hideFlexTab').find('input:checked').val());
			data.hideAvatars = JSON.parse($('#hideAvatars').find('input:checked').val());
			data.messageViewMode = parseInt($('#messageViewMode').find('select').val());
			data.sendOnEnter = $('#sendOnEnter').find('select').val();
			if (RocketChat.settings.get('UI_DisplayRoles')) {
				data.hideRoles = JSON.parse($('#hideRoles').find('input:checked').val());
			}
		}

		if (RocketChat.settings.get('UI_DisplaySidebar')) {
			data.roomCounterSidebar = JSON.parse($('#roomCounterSidebar').find('input:checked').val());
		}

		if (RocketChat.settings.get('UI_DisplayHighlights')) {
			data.highlights = _.compact(_.map($('[name=highlights]').val().split(/,|\n/), function(e) {
				return s.trim(e);
			}));
			const highlights = RocketChat.getUserPreference(Meteor.userId(), 'highlights');
			if (highlights && highlights.join('\n') !== data.highlights.join('\n')) {
				reload = true;
			}
		}

		if (RocketChat.settings.get('UI_DisplaySound')) {
			data.newRoomNotification = $('select[name=newRoomNotification]').val();
			data.newMessageNotification = $('select[name=newMessageNotification]').val();
			data.muteFocusedConversations = JSON.parse($('#muteFocusedConversations').find('input:checked').val());
			data.notificationsSoundVolume = parseInt($('#notificationsSoundVolume').val());
		}

		Meteor.call('saveUserPreferences', data, function(error, results) {
			if (results) {
				toastr.success(t('Preferences_saved'));
				instance.clearForm();
				if (reload) {
					setTimeout(function() {
						if (Meteor._reload && Meteor._reload.reload) { // make it compatible with old meteor
							Meteor._reload.reload();
						} else {
							Reload._reload();
						}
					}, 1000);
				}
			}
			if (error) {
				return handleError(error);
			}
		});
	};

	this.downloadMyData = function(fullExport = false) {
		if (!RocketChat.settings.get('UI_DisplayMyData')) {
			return false;
		}
		Meteor.call('requestDataDownload', { fullExport }, function(error, results) {
			if (results) {
				if (results.requested) {
					modal.open({
						title: t('UserDataDownload_Requested'),
						text: t('UserDataDownload_Requested_Text'),
						type: 'success',
					});

					return true;
				}

				if (results.exportOperation) {
					if (results.exportOperation.status === 'completed') {
						modal.open({
							title: t('UserDataDownload_Requested'),
							text: t('UserDataDownload_CompletedRequestExisted_Text'),
							type: 'success',
						});

						return true;
					}

					modal.open({
						title: t('UserDataDownload_Requested'),
						text: t('UserDataDownload_RequestExisted_Text'),
						type: 'success',
					});
					return true;
				}

				modal.open({
					title: t('UserDataDownload_Requested'),
					type: 'success',
				});
				return true;
			}

			if (error) {
				return handleError(error);
			}
		});
	};

	this.exportMyData = function() {
		if (!RocketChat.settings.get('UI_DisplayMyData')) {
			return false;
		}
		this.downloadMyData(true);
	};
});

Template.accountPreferences.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

Template.accountPreferences.events({
	'click .rc-header__section-button .save'(e, t) {
		t.save();
	},
	'change input[name=useEmojis]'(e, t) {
		t.useEmojis.set($(e.currentTarget).val() === '1');
	},
	'click .enable-notifications'() {
		KonchatNotification.getDesktopPermission();
	},
	'click .download-my-data'(e, t) {
		e.preventDefault();
		t.downloadMyData();
	},
	'click .export-my-data'(e, t) {
		e.preventDefault();
		t.exportMyData();
	},
	'click .test-notifications'(e) {
		e.preventDefault();
		KonchatNotification.notify({
			duration: $('input[name=desktopNotificationDuration]').val(),
			payload: { sender: { username: 'rocket.cat' },
			},
			title: TAPi18n.__('Desktop_Notification_Test'),
			text: TAPi18n.__('This_is_a_desktop_notification'),
		});
	},
	'change .audio'(e) {
		e.preventDefault();
		const audio = $(e.currentTarget).val();
		if (audio === 'none') {
			return;
		}
		if (audio) {
			const $audio = $(`audio#${ audio }`);
			return $audio && $audio[0] && $audio[0].play();
		}
	},
	'click .js-dont-ask-remove'(e) {
		e.preventDefault();
		const selectEl = document.getElementById('dont-ask');
		const { options } = selectEl;
		const selectedOption = selectEl.value;
		const optionIndex = Array.from(options).findIndex((option) => option.value === selectedOption);

		selectEl.remove(optionIndex);
	},
});
