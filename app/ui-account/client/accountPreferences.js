import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Reload } from 'meteor/reload';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

import { t, handleError, getUserPreference } from '../../utils';
import { modal, SideNav } from '../../ui-utils';
import { KonchatNotification } from '../../ui';
import { settings } from '../../settings';
import { CustomSounds } from '../../custom-sounds/client';

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
	return getUserPreference(Meteor.userId(), property, defaultValue) === value;
}

Template.accountPreferences.helpers({
	audioAssets() {
		return (CustomSounds && CustomSounds.getList && CustomSounds.getList()) || [];
	},
	newMessageNotification() {
		return getUserPreference(Meteor.userId(), 'newMessageNotification');
	},
	newRoomNotification() {
		return getUserPreference(Meteor.userId(), 'newRoomNotification');
	},
	muteFocusedConversations() {
		return getUserPreference(Meteor.userId(), 'muteFocusedConversations');
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
		const userHighlights = getUserPreference(Meteor.userId(), 'highlights');
		return userHighlights ? userHighlights.join(',\n') : undefined;
	},
	desktopNotificationEnabled() {
		return KonchatNotification.notificationStatus.get() === 'granted' || (window.Notification && Notification.permission === 'granted');
	},
	desktopNotificationDisabled() {
		return KonchatNotification.notificationStatus.get() === 'denied' || (window.Notification && Notification.permission === 'denied');
	},
	desktopNotificationDuration() {
		const userPref = getUserPreference(Meteor.userId(), 'desktopNotificationDuration', 'undefined');
		return userPref !== 'undefined' ? userPref : undefined;
	},
	defaultDesktopNotificationDuration() {
		return settings.get('Accounts_Default_User_Preferences_desktopNotificationDuration');
	},
	idleTimeLimit() {
		return getUserPreference(Meteor.userId(), 'idleTimeLimit');
	},
	defaultIdleTimeLimit() {
		return settings.get('Accounts_Default_User_Preferences_idleTimeLimit');
	},
	defaultDesktopNotification() {
		return notificationLabels[settings.get('Accounts_Default_User_Preferences_desktopNotifications')];
	},
	defaultMobileNotification() {
		return notificationLabels[settings.get('Accounts_Default_User_Preferences_mobileNotifications')];
	},
	defaultEmailNotification() {
		return emailLabels[settings.get('Accounts_Default_User_Preferences_emailNotificationMode')];
	},
	showRoles() {
		return settings.get('UI_DisplayRoles');
	},
	userDataDownloadEnabled() {
		return settings.get('UserData_EnableDownload') !== false;
	},
	notificationsSoundVolume() {
		return getUserPreference(Meteor.userId(), 'notificationsSoundVolume');
	},
	dontAskAgainList() {
		return getUserPreference(Meteor.userId(), 'dontAskAgainList');
	},
});

Template.accountPreferences.onCreated(function() {
	const settingsTemplate = this.parentTemplate(3);

	if (settingsTemplate.child == null) {
		settingsTemplate.child = [];
	}

	settingsTemplate.child.push(this);

	this.useEmojis = new ReactiveVar(getUserPreference(Meteor.userId(), 'useEmojis'));

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

	this.shouldUpdateLocalStorageSetting = function(setting, newValue) {
		return localStorage.getItem(setting) !== newValue;
	};

	this.save = function() {
		instance = this;
		const data = {};

		data.newRoomNotification = $('select[name=newRoomNotification]').val();
		data.newMessageNotification = $('select[name=newMessageNotification]').val();
		data.clockMode = parseInt($('select[name=clockMode]').val());
		data.useEmojis = JSON.parse($('input[name=useEmojis]:checked').val());
		data.convertAsciiEmoji = JSON.parse($('input[name=convertAsciiEmoji]:checked').val());
		data.saveMobileBandwidth = JSON.parse($('input[name=saveMobileBandwidth]:checked').val());
		data.collapseMediaByDefault = JSON.parse($('input[name=collapseMediaByDefault]:checked').val());
		data.muteFocusedConversations = JSON.parse($('#muteFocusedConversations').find('input:checked').val());
		data.hideUsernames = JSON.parse($('#hideUsernames').find('input:checked').val());
		data.messageViewMode = parseInt($('#messageViewMode').find('select').val());
		data.hideFlexTab = JSON.parse($('#hideFlexTab').find('input:checked').val());
		data.hideAvatars = JSON.parse($('#hideAvatars').find('input:checked').val());
		data.sendOnEnter = $('#sendOnEnter').find('select').val();
		data.autoImageLoad = JSON.parse($('input[name=autoImageLoad]:checked').val());
		data.emailNotificationMode = $('select[name=emailNotificationMode]').val();
		data.desktopNotificationDuration = $('input[name=desktopNotificationDuration]').val() === '' ? settings.get('Accounts_Default_User_Preferences_desktopNotificationDuration') : parseInt($('input[name=desktopNotificationDuration]').val());
		data.desktopNotifications = $('#desktopNotifications').find('select').val();
		data.mobileNotifications = $('#mobileNotifications').find('select').val();
		data.unreadAlert = JSON.parse($('#unreadAlert').find('input:checked').val());
		data.sidebarShowDiscussion = JSON.parse($('#sidebarShowDiscussion').find('input:checked').val());
		data.sidebarShowServiceAccounts = JSON.parse($('#sidebarShowServiceAccounts').find('input:checked').val());
		data.notificationsSoundVolume = parseInt($('#notificationsSoundVolume').val());
		data.roomCounterSidebar = JSON.parse($('#roomCounterSidebar').find('input:checked').val());
		data.highlights = _.compact(_.map($('[name=highlights]').val().split(/,|\n/), function(e) {
			return s.trim(e);
		}));
		data.dontAskAgainList = Array.from(document.getElementById('dont-ask').options).map((option) => ({ action: option.value, label: option.text }));

		let reload = false;

		if (settings.get('UI_DisplayRoles')) {
			data.hideRoles = JSON.parse($('#hideRoles').find('input:checked').val());
		}

		// if highlights changed we need page reload
		const highlights = getUserPreference(Meteor.userId(), 'highlights');
		if (highlights && highlights.join('\n') !== data.highlights.join('\n')) {
			reload = true;
		}

		const selectedLanguage = $('#language').val();
		if (this.shouldUpdateLocalStorageSetting('userLanguage', selectedLanguage)) {
			localStorage.setItem('userLanguage', selectedLanguage);
			data.language = selectedLanguage;
			reload = true;
		}

		const enableAutoAway = JSON.parse($('#enableAutoAway').find('input:checked').val());
		data.enableAutoAway = enableAutoAway;
		if (this.shouldUpdateLocalStorageSetting('enableAutoAway', enableAutoAway)) {
			localStorage.setItem('enableAutoAway', enableAutoAway);
			reload = true;
		}

		const idleTimeLimit = $('input[name=idleTimeLimit]').val() === '' ? settings.get('Accounts_Default_User_Preferences_idleTimeLimit') : parseInt($('input[name=idleTimeLimit]').val());
		data.idleTimeLimit = idleTimeLimit;
		if (this.shouldUpdateLocalStorageSetting('idleTimeLimit', idleTimeLimit)) {
			localStorage.setItem('idleTimeLimit', idleTimeLimit);
			reload = true;
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
		Meteor.call('requestDataDownload', { fullExport }, function(error, results) {
			if (results) {
				if (results.requested) {
					modal.open({
						title: t('UserDataDownload_Requested'),
						text: t('UserDataDownload_Requested_Text', { pending_operations: results.pendingOperationsBeforeMyRequest }),
						type: 'success',
						html: true,
					});

					return true;
				}

				if (results.exportOperation) {
					if (results.exportOperation.status === 'completed') {
						const text = results.url
							? TAPi18n.__('UserDataDownload_CompletedRequestExistedWithLink_Text', { download_link: results.url })
							: t('UserDataDownload_CompletedRequestExisted_Text');

						modal.open({
							title: t('UserDataDownload_Requested'),
							text,
							type: 'success',
							html: true,
						});

						return true;
					}

					modal.open({
						title: t('UserDataDownload_Requested'),
						text: t('UserDataDownload_RequestExisted_Text', { pending_operations: results.pendingOperationsBeforeMyRequest }),
						type: 'success',
						html: true,
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
	'click .download-my-data'(e, t) {
		e.preventDefault();
		t.downloadMyData();
	},
	'click .export-my-data'(e, t) {
		e.preventDefault();
		t.exportMyData();
	},
	'click .js-test-notifications'(e) {
		e.preventDefault();
		KonchatNotification.notify({
			duration: $('input[name=desktopNotificationDuration]').val(),
			payload: { sender: { username: 'rocket.cat' },
			},
			title: TAPi18n.__('Desktop_Notification_Test'),
			text: TAPi18n.__('This_is_a_desktop_notification'),
		});
	},
	'click .js-enable-notifications'() {
		KonchatNotification.getDesktopPermission();
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
