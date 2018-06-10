/* globals UserPresence, fireGlobalEvent, isRtl */

import moment from 'moment';
import toastr from 'toastr';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

hljs.initHighlightingOnLoad();

if (window.DISABLE_ANIMATION) {
	toastr.options.timeOut = 1;
	toastr.options.showDuration = 0;
	toastr.options.hideDuration = 0;
	toastr.options.extendedTimeOut = 0;
}

Meteor.startup(function() {
	TimeSync.loggingEnabled = false;



	Session.setDefault('AvatarRandom', 0);

	window.lastMessageWindow = {};
	window.lastMessageWindowHistory = {};

	TAPi18n.conf.i18n_files_route = Meteor._relativeToSiteRootUrl('/tap-i18n');

	const defaultAppLanguage = function() {
		let lng = window.navigator.userLanguage || window.navigator.language || 'en';
		// Fix browsers having all-lowercase language settings eg. pt-br, en-us
		const re = /([a-z]{2}-)([a-z]{2})/;
		if (re.test(lng)) {
			lng = lng.replace(re, (match, ...parts) => {
				return parts[0] + parts[1].toUpperCase();
			});
		}
		return lng;
	};

	window.defaultUserLanguage = function() {
		return RocketChat.settings.get('Language') || defaultAppLanguage();
	};

	const availableLanguages = TAPi18n.getLanguages();
	const loadedLanguages = [];

	window.setLanguage = function(language) {
		if (!language) {
			return;
		}

		if (loadedLanguages.indexOf(language) > -1) {
			return;
		}

		loadedLanguages.push(language);

		if (isRtl(language)) {
			$('html').addClass('rtl');
		} else {
			$('html').removeClass('rtl');
		}

		if (!availableLanguages[language]) {
			language = language.split('-').shift();
		}

		TAPi18n.setLanguage(language);

		language = language.toLowerCase();
		if (language !== 'en') {
			Meteor.call('loadLocale', language, (err, localeFn) => {
				Function(localeFn).call({moment});
				moment.locale(language);
			});
		}
	};

	Tracker.autorun(function(computation) {
		if (!Meteor.userId() && !RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return;
		}
		Meteor.subscribe('userData');
		Meteor.subscribe('activeUsers');
		computation.stop();
	});

	let status = undefined;
	Tracker.autorun(function() {
		if (!Meteor.userId()) {
			return;
		}
		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: {
				status: 1,
				language: 1,
				'settings.idleTimeLimit': 1,
				'settings.enableAutoAway': 1
			}
		});

		if (!user) {
			return;
		}

		const userLanguage = user.language ? user.language : window.defaultUserLanguage();
		if (localStorage.getItem('userLanguage') !== userLanguage) {
			localStorage.setItem('userLanguage', userLanguage);
			window.setLanguage(userLanguage);
		}

		if (RocketChat.getUserPreference(user, 'enableAutoAway')) {
			const idleTimeLimit = RocketChat.getUserPreference(user, 'idleTimeLimit') || 300;
			UserPresence.awayTime = idleTimeLimit * 1000;
		}

		UserPresence.start();

		if (user.status !== status) {
			status = user.status;
			fireGlobalEvent('status-changed', status);
		}
	});
});
