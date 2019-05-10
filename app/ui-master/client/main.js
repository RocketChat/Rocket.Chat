import Clipboard from 'clipboard';
import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getConfig } from '../../ui-utils/client/config';
import { t, getUserPreference } from '../../utils';
import { chatMessages } from '../../ui';
import { mainReady, Layout, iframeLogin, modal, popover, menu, fireGlobalEvent, RoomManager } from '../../ui-utils';
import { toolbarSearch } from '../../ui-sidenav';
import { settings } from '../../settings';
import { CachedChatSubscription, Roles, ChatSubscription, Users } from '../../models';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { hasRole } from '../../authorization';
import { tooltip } from '../../tooltip';

settings.collection.find({ _id: /theme-color-rc/i }, { fields: { value: 1 } }).observe({ changed: () => { DynamicCss.run(true, settings); } });

Template.body.onRendered(function() {
	new Clipboard('.clipboard');

	$(document.body).on('keydown', function(e) {
		if ((e.keyCode === 80 || e.keyCode === 75) && (e.ctrlKey === true || e.metaKey === true) && e.shiftKey === false) {
			e.preventDefault();
			e.stopPropagation();
			toolbarSearch.show(true);
		}
		const unread = Session.get('unread');
		if (e.keyCode === 27 && (e.shiftKey === true || e.ctrlKey === true) && (unread != null) && unread !== '') {
			e.preventDefault();
			e.stopPropagation();
			modal.open({
				title: t('Clear_all_unreads_question'),
				type: 'warning',
				confirmButtonText: t('Yes_clear_all'),
				showCancelButton: true,
				cancelButtonText: t('Cancel'),
				confirmButtonColor: '#DD6B55',
			}, function() {
				const subscriptions = ChatSubscription.find({
					open: true,
				}, {
					fields: {
						unread: 1,
						alert: 1,
						rid: 1,
						t: 1,
						name: 1,
						ls: 1,
					},
				});

				subscriptions.forEach((subscription) => {
					if (subscription.alert || subscription.unread > 0) {
						Meteor.call('readMessages', subscription.rid);
					}
				});
			});
		}
	});

	$(document.body).on('keydown', function(e) {
		const { target } = e;
		if (e.ctrlKey === true || e.metaKey === true) {
			popover.close();
			return;
		}
		if (!((e.keyCode > 45 && e.keyCode < 91) || e.keyCode === 8)) {
			return;
		}

		if (/input|textarea|select/i.test(target.tagName)) {
			return;
		}
		if (target.id === 'pswp') {
			return;
		}

		popover.close();

		const inputMessage = chatMessages[RoomManager.openedRoom] && chatMessages[RoomManager.openedRoom].input;
		if (!inputMessage) {
			return;
		}
		inputMessage.focus();
	});

	$(document.body).on('click', function(e) {
		if (e.target.tagName === 'A') {
			const link = e.currentTarget;
			if (link.origin === s.rtrim(Meteor.absoluteUrl(), '/') && /msg=([a-zA-Z0-9]+)/.test(link.search)) {
				e.preventDefault();
				e.stopPropagation();
				if (Layout.isEmbedded()) {
					return fireGlobalEvent('click-message-link', {
						link: link.pathname + link.search,
					});
				}
				return FlowRouter.go(link.pathname + link.search, null, FlowRouter.current().queryParams);
			}
		}
	});

	Tracker.autorun(function(c) {
		const w = window;
		const d = document;
		const script = 'script';
		const l = 'dataLayer';
		const i = settings.get('GoogleTagManager_id');
		if (Match.test(i, String) && i.trim() !== '') {
			c.stop();
			return (function(w, d, s, l, i) {
				w[l] = w[l] || [];
				w[l].push({
					'gtm.start': new Date().getTime(),
					event: 'gtm.js',
				});
				const f = d.getElementsByTagName(s)[0];
				const j = d.createElement(s);
				const dl = l !== 'dataLayer' ? `&l=${ l }` : '';
				j.async = true;
				j.src = `//www.googletagmanager.com/gtm.js?id=${ i }${ dl }`;
				return f.parentNode.insertBefore(j, f);
			}(w, d, script, l, i));
		}
	});
});

Template.main.onCreated(function() {
	tooltip.init();
});


const skipActiveUsersToBeReady = [getConfig('experimental'), getConfig('skipActiveUsersToBeReady')].includes('true');
Template.main.helpers({
	removeSidenav() {
		return Layout.isEmbedded() && !/^\/admin/.test(FlowRouter.current().route.path);
	},
	siteName() {
		return settings.get('Site_Name');
	},
	logged() {
		if (Meteor.userId() != null || (settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true)) {
			$('html').addClass('noscroll').removeClass('scroll');
			return true;
		}
		$('html').addClass('scroll').removeClass('noscroll');
		return false;
	},
	useIframe() {
		const iframeEnabled = typeof iframeLogin !== 'undefined';
		return iframeEnabled && iframeLogin.reactiveEnabled.get();
	},
	iframeUrl() {
		const iframeEnabled = typeof iframeLogin !== 'undefined';
		return iframeEnabled && iframeLogin.reactiveIframeUrl.get();
	},
	subsReady() {
		const subscriptions = ['userData'];
		if (!skipActiveUsersToBeReady) {
			subscriptions.push('activeUsers');
		}
		const routerReady = FlowRouter.subsReady.apply(FlowRouter, subscriptions);

		const subscriptionsReady = CachedChatSubscription.ready.get();
		const settingsReady = settings.cachedCollection.ready.get();

		const ready = (routerReady && subscriptionsReady && settingsReady) || !Meteor.userId();

		CachedCollectionManager.syncEnabled = ready;
		mainReady.set(ready);

		return ready;
	},
	hasUsername() {
		const uid = Meteor.userId();
		const user = uid && Users.findOne({ _id: uid }, { fields: { username: 1 } });
		return (user && user.username) || settings.get('Accounts_AllowAnonymousRead');
	},
	requirePasswordChange() {
		const user = Meteor.user();
		return user && user.requirePasswordChange === true;
	},
	require2faSetup() {
		const user = Meteor.user();

		// User is already using 2fa
		if (user.services.totp !== undefined && user.services.totp.enabled) {
			return false;
		}

		const mandatoryRole = Roles.findOne({ _id: { $in: user.roles }, mandatory2fa: true });
		return mandatoryRole !== undefined;
	},
	CustomScriptLoggedOut() {
		const script = settings.get('Custom_Script_Logged_Out') || '';
		if (script.trim()) {
			eval(script);//eslint-disable-line
		}
	},
	CustomScriptLoggedIn() {
		const script = settings.get('Custom_Script_Logged_In') || '';
		if (script.trim()) {
			eval(script);//eslint-disable-line
		}
	},
	embeddedVersion() {
		if (Layout.isEmbedded()) {
			return 'embedded-view';
		}
	},
	showSetupWizard() {
		const userId = Meteor.userId();
		const Show_Setup_Wizard = settings.get('Show_Setup_Wizard');

		return (!userId && Show_Setup_Wizard === 'pending') || (userId && hasRole(userId, 'admin') && Show_Setup_Wizard === 'in_progress');
	},
});

Template.main.events({
	'click .burger'() {
		return menu.toggle();
	},
});

Template.main.onRendered(function() {
	$('#initial-page-loading').remove();

	return Tracker.autorun(function() {
		const userId = Meteor.userId();
		const Show_Setup_Wizard = settings.get('Show_Setup_Wizard');

		if ((!userId && Show_Setup_Wizard === 'pending') || (userId && hasRole(userId, 'admin') && Show_Setup_Wizard === 'in_progress')) {
			FlowRouter.go('setup-wizard');
		}
		if (getUserPreference(userId, 'hideUsernames')) {
			$(document.body).on('mouseleave', 'button.thumb', function() {
				return tooltip.hide();
			});
			return $(document.body).on('mouseenter', 'button.thumb', function(e) {
				const avatarElem = $(e.currentTarget);
				const username = avatarElem.attr('data-username');
				if (username) {
					e.stopPropagation();
					return tooltip.showElement($('<span>').text(username), avatarElem);
				}
			});
		}
		$(document.body).off('mouseenter', 'button.thumb');
		return $(document.body).off('mouseleave', 'button.thumb');
	});
});

Meteor.startup(function() {
	return fireGlobalEvent('startup', true);
});
