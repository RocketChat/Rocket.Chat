import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { ChatRoom } from '../../../../../../models/client/models/ChatRoom';
import { Notifications } from '../../../../../../notifications/client';
import { settings } from '../../../../../../settings/client';
import { ChatSubscription } from '../../../../../../models/client';

Template.AssistifySmarti.onCreated(function() {
	this.room = new ReactiveVar(null);
	this.smartiLoaded = new ReactiveVar(false);
	this.maxTriesLoading = 10;
	this.timeoutMs = 2000;
	this.currentTryLoading = new ReactiveVar(0);
	this.reactOnSmartiDirty = new ReactiveVar(true);

	const instance = this;

	this.autorun(() => {
		if (instance.data.rid) {
			const room = ChatRoom.findOne(instance.data.rid);
			instance.room.set(room);
		}
	});

	/*
	Once this template is created (meaning: Once the tab is opened),
	the user is interested in what Smarti is analyzing =>
	Hook into an event issued by the backend to allow requesting an analysis
	*/
	Notifications.onRoom(instance.data.rid, 'assistify-smarti-dirty', () => {
		if (this.reactOnSmartiDirty.get()) {
			if (!settings.get('Assistify_AI_Smarti_Inline_Highlighting_Enabled')) { // Inline highlighting will anyway trigger the analysis - we don't need it twice
				Meteor.call('analyze', instance.data.rid);
			}
		}
	});
});

Template.AssistifySmarti.onDestroyed(function() {
	this.reactOnSmartiDirty.set(false);
	clearTimeout(this.loading);
});

/**
 * Create Smarti (as soon as the script is loaded)
 * @namespace SmartiWidget
 */
Template.AssistifySmarti.onRendered(function() {
	const instance = this;

	/* in order to avoid duplicated scrollbars, have the outer one hidden */
	// const parentContainer = this.$(':parent').parent();
	// parentContainer.css('overflow-y', 'initial');
	// this.$('.smarti-widget').css('overflow-y', 'auto');

	function createSmarti() {
		if (window.SmartiWidget === undefined) {
			console.log(`Couldn't load Smarti-Widget - try ${ instance.currentTryLoading.get() }`);
			instance.currentTryLoading.set(instance.currentTryLoading.get() + 1);
			if (instance.currentTryLoading.get() < instance.maxTriesLoading) {
				instance.loading = setTimeout(createSmarti, instance.timeoutMs);
			}
		} else {
			instance.smartiLoaded.set(true);
			const ROCKET_CHAT_URL = settings.get('Site_Url').replace(/\/?$/, '/');
			// stripping only the protocol ("http") from the site-url either creates a secure or an insecure websocket connection
			const WEBSOCKET_URL = `ws${ ROCKET_CHAT_URL.substring(4) }websocket/`;
			const WIDGET_POSTING_TYPE = settings.get('Assistify_AI_Widget_Posting_Type') || 'postRichText';
			const SMARTI_CLIENT_NAME = settings.get('Assistify_AI_Smarti_Domain');

			const smartiOptions = {
				socketEndpoint: WEBSOCKET_URL,
				clientName: SMARTI_CLIENT_NAME,
				channel: instance.data.rid,
				postings: {
					type: WIDGET_POSTING_TYPE,
					cssInputSelector: '.rc-message-box .js-input-message',
				},
				lang: localStorage.getItem('userLanguage').split('-')[0],
			};

			// propagate i18n - support formatted strings while doing that
			const i18nSetting = settings.get('Assistify_AI_Smarti_Widget_i18n');
			const i18n = i18nSetting.search('\n') > -1 ? JSON.parse(i18nSetting) : i18nSetting;
			if (i18n) {
				smartiOptions.i18n = i18n;
			}

			console.debug('Initializing Smarti with options: ', JSON.stringify(smartiOptions, null, 2));
			instance.smarti = new window.SmartiWidget(instance.find('.smarti #widgetContainer'), smartiOptions);
		}
	}

	createSmarti();
});

Template.AssistifySmarti.helpers({
	isLivechat() {
		const instance = Template.instance();
		return ChatSubscription.findOne({ rid: instance.data.rid }).t === 'l';
	},
	/**
	 This helper is needed in order to create an object which matches the actions bar importing parameters
	 */
	liveChatActions() {
		const instance = Template.instance();
		return { roomId: instance.data.rid };
	},
	loadingClass() {
		const instance = Template.instance();
		if (instance.smartiLoaded.get()) {
			return 'ready';
		}
		return instance.currentTryLoading.get() < instance.maxTriesLoading ? 'loading' : 'not-available';
	},
	isLoading() {
		const instance = Template.instance();
		return !instance.smartiLoaded.get() && instance.currentTryLoading.get() < instance.maxTriesLoading;
	},
	loadingNotification() {
		const instance = Template.instance();
		if (instance.currentTryLoading.get() < instance.maxTriesLoading && instance.currentTryLoading.get() > 3) {
			return TAPi18n.__('Widget_loading');
		}

		if (instance.currentTryLoading.get() === instance.maxTriesLoading) {
			return TAPi18n.__('Widget_could_not_load');
		}
	},
});

Template.AssistifySmarti.events({
	'click .js-resync-room'(event, instance) {
		if (instance.data.rid) {
			Meteor.call('resyncRoom', instance.data.rid);
		}
	},
});
