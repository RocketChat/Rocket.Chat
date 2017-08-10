/* globals toolbarSearch, menu, isRtl, fireGlobalEvent, CachedChatSubscription */
import Clipboard from 'clipboard';

Template.body.onRendered(function() {
	new Clipboard('.clipboard');

	$(document.body).on('keydown', function(e) {
		if ((e.keyCode === 80 || e.keyCode === 75) && (e.ctrlKey === true || e.metaKey === true) && e.shiftKey === false) {
			e.preventDefault();
			e.stopPropagation();
			toolbarSearch.focus(true);
		}
		const unread = Session.get('unread');
		if (e.keyCode === 27 && e.shiftKey === true && (unread != null) && unread !== '') {
			e.preventDefault();
			e.stopPropagation();
			return swal({
				title: t('Clear_all_unreads_question'),
				type: 'warning',
				confirmButtonText: t('Yes_clear_all'),
				showCancelButton: true,
				cancelButtonText: t('Cancel'),
				confirmButtonColor: '#DD6B55'
			}, function() {
				const subscriptions = ChatSubscription.find({
					open: true
				}, {
					fields: {
						unread: 1,
						alert: 1,
						rid: 1,
						t: 1,
						name: 1,
						ls: 1
					}
				});

				subscriptions.forEach((subscription) =>{
					if (subscription.alert || subscription.unread > 0) {
						Meteor.call('readMessages', subscription.rid);
					}
				});
			});
		}
	});

	$(document.body).on('keydown', function(e) {
		const target = e.target;
		if (e.ctrlKey === true || e.metaKey === true) {
			return;
		}
		if (!(e.keyCode > 45 && e.keyCode < 91 || e.keyCode === 8)) {
			return;
		}
		if (/input|textarea|select/i.test(target.tagName)) {
			return;
		}
		if (target.id === 'pswp') {
			return;
		}
		const inputMessage = $('textarea.input-message');
		if (inputMessage.length === 0) {
			return;
		}
		return inputMessage.focus();
	});
	$(document.body).on('click', 'a', function(e) {
		const link = e.currentTarget;
		if (link.origin === s.rtrim(Meteor.absoluteUrl(), '/') && /msg=([a-zA-Z0-9]+)/.test(link.search)) {
			e.preventDefault();
			e.stopPropagation();
			if (RocketChat.Layout.isEmbedded()) {
				return fireGlobalEvent('click-message-link', {
					link: link.pathname + link.search
				});
			}
			return FlowRouter.go(link.pathname + link.search, null, FlowRouter.current().queryParams);
		}
	});
	Tracker.autorun(function(c) {
		const w = window;
		const d = document;
		const s = 'script';
		const l = 'dataLayer';
		const i = RocketChat.settings.get('GoogleTagManager_id');
		if (Match.test(i, String) && i.trim() !== '') {
			c.stop();
			return (function(w, d, s, l, i) {
				w[l] = w[l] || [];
				w[l].push({
					'gtm.start': new Date().getTime(),
					event: 'gtm.js'
				});
				const f = d.getElementsByTagName(s)[0];
				const j = d.createElement(s);
				const dl = l !== 'dataLayer' ? `&l=${ l }` : '';
				j.async = true;
				j.src = `//www.googletagmanager.com/gtm.js?id=${ i }${ dl }`;
				return f.parentNode.insertBefore(j, f);
			}(w, d, s, l, i));
		}
	});
	if (Meteor.isCordova) {
		return $(document.body).addClass('is-cordova');
	}
});

RocketChat.mainReady = new ReactiveVar(false);
Template.main.helpers({
	siteName() {
		return RocketChat.settings.get('Site_Name');
	},
	logged() {
		if (Meteor.userId() != null || (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true)) {
			$('html').addClass('noscroll').removeClass('scroll');
			return true;
		} else {
			$('html').addClass('scroll').removeClass('noscroll');
			return false;
		}
	},
	useIframe() {
		const iframeEnabled = typeof RocketChat.iframeLogin !== 'undefined';
		return iframeEnabled && RocketChat.iframeLogin.reactiveEnabled.get();
	},
	iframeUrl() {
		const iframeEnabled = typeof RocketChat.iframeLogin !== 'undefined';
		return iframeEnabled && RocketChat.iframeLogin.reactiveIframeUrl.get();
	},
	subsReady() {
		const routerReady = FlowRouter.subsReady('userData', 'activeUsers');
		const subscriptionsReady = CachedChatSubscription.ready.get();
		const settingsReady = RocketChat.settings.cachedCollection.ready.get();
		const ready = (Meteor.userId() == null) || (routerReady && subscriptionsReady && settingsReady);
		RocketChat.CachedCollectionManager.syncEnabled = ready;
		Meteor.defer(() => {
			RocketChat.mainReady.set(ready);
		});
		return ready;
	},
	hasUsername() {
		return (Meteor.userId() != null && Meteor.user().username != null) || (Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true);
	},
	requirePasswordChange() {
		const user = Meteor.user();
		return user && user.requirePasswordChange === true;
	},
	CustomScriptLoggedOut() {
		const script = RocketChat.settings.get('Custom_Script_Logged_Out') || '';
		if (script.trim()) {
			eval(script);//eslint-disable-line
		}
	},
	CustomScriptLoggedIn() {
		const script = RocketChat.settings.get('Custom_Script_Logged_In') || '';
		if (script.trim()) {
			eval(script);//eslint-disable-line
		}
	},
	embeddedVersion() {
		if (RocketChat.Layout.isEmbedded()) {
			return 'embedded-view';
		}
	}
});

Template.main.events({
	'click .burger'() {
		if (window.rocketDebug) {
			console.log('room click .burger');
		}
		return menu.toggle();
	},
	'touchstart'(e, t) {
		if (document.body.clientWidth > 780) {
			return;
		}
		t.touchstartX = undefined;
		t.touchstartY = undefined;
		t.movestarted = false;
		t.blockmove = false;
		t.isRtl = isRtl(localStorage.getItem('userLanguage'));
		if ($(e.currentTarget).closest('.main-content').length > 0) {
			t.touchstartX = e.originalEvent.touches[0].clientX;
			t.touchstartY = e.originalEvent.touches[0].clientY;
			t.mainContent = $('.main-content');
			return t.wrapper = $('.messages-box > .wrapper');
		}
	},
	'touchmove'(e, t) {
		if (t.touchstartX != null) {
			const touch = e.originalEvent.touches[0];
			const diffX = touch.clientX - t.touchstartX;
			const diffY = touch.clientY - t.touchstartY;
			const absX = Math.abs(diffX);
			const absY = Math.abs(diffY);
			if (t.movestarted !== true && t.blockmove !== true && absY > 5) {
				t.blockmove = true;
			}
			if (t.blockmove !== true && (t.movestarted === true || absX > 5)) {
				t.movestarted = true;
				if (t.isRtl) {
					if (menu.isOpen()) {
						t.diff = -260 + diffX;
					} else {
						t.diff = diffX;
					}
					if (t.diff < -260) {
						t.diff = -260;
					}
					if (t.diff > 0) {
						t.diff = 0;
					}
				} else {
					if (menu.isOpen()) {
						t.diff = 260 + diffX;
					} else {
						t.diff = diffX;
					}
					if (t.diff > 260) {
						t.diff = 260;
					}
					if (t.diff < 0) {
						t.diff = 0;
					}
				}
				t.mainContent.addClass('notransition');
				t.mainContent.css('transform', `translate(${ t.diff }px)`);
				return t.wrapper.css('overflow', 'hidden');
			}
		}
	},
	'touchend'(e, t) {
		if (t.movestarted === true) {
			t.mainContent.removeClass('notransition');
			t.wrapper.css('overflow', '');
			if (t.isRtl) {
				if (menu.isOpen()) {
					if (t.diff >= -200) {
						return menu.close();
					} else {
						return menu.open();
					}
				} else if (t.diff <= -60) {
					return menu.open();
				} else {
					return menu.close();
				}
			} else if (menu.isOpen()) {
				if (t.diff >= 200) {
					return menu.open();
				} else {
					return menu.close();
				}
			} else if (t.diff >= 60) {
				return menu.open();
			} else {
				return menu.close();
			}
		}
	}
});

Template.main.onRendered(function() {
	if (isRtl(localStorage.getItem('userLanguage'))) {
		$('html').addClass('rtl');
	} else {
		$('html').removeClass('rtl');
	}
	$('#initial-page-loading').remove();
	window.addEventListener('focus', function() {
		return Meteor.setTimeout(function() {
			if (!$(':focus').is('INPUT,TEXTAREA')) {
				return $('.input-message').focus();
			}
		}, 100);
	});
	return Tracker.autorun(function() {
		swal.setDefaults({
			cancelButtonText: t('Cancel')
		});
		const user = Meteor.user();
		const settings = user && user.settings;
		const prefs = settings && settings.preferences;
		if (prefs && prefs.hideUsernames != null) {
			$(document.body).on('mouseleave', 'button.thumb', function() {
				return RocketChat.tooltip.hide();
			});
			return $(document.body).on('mouseenter', 'button.thumb', function(e) {
				const avatarElem = $(e.currentTarget);
				const username = avatarElem.attr('data-username');
				if (username) {
					e.stopPropagation();
					return RocketChat.tooltip.showElement($('<span>').text(username), avatarElem);
				}
			});
		} else {
			$(document.body).off('mouseenter', 'button.thumb');
			return $(document.body).off('mouseleave', 'button.thumb');
		}
	});
});

Meteor.startup(function() {
	return fireGlobalEvent('startup', true);
});
