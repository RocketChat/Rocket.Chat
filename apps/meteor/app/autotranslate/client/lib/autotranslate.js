import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import mem from 'mem';

import { Subscriptions, Messages } from '../../../models';
import { hasPermission } from '../../../authorization';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';

let userLanguage = 'en';
let username = '';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const user = Meteor.user();
		if (!user) {
			return;
		}
		userLanguage = user.language || 'en';
		username = user.username;
	});
});

export const AutoTranslate = {
	initialized: false,
	providersMetadata: {},
	messageIdsToWait: {},
	supportedLanguages: [],

	findSubscriptionByRid: mem((rid) => Subscriptions.findOne({ rid })),

	getLanguage(rid) {
		let subscription = {};
		if (rid) {
			subscription = this.findSubscriptionByRid(rid);
		}
		const language = (subscription && subscription.autoTranslateLanguage) || userLanguage || window.defaultUserLanguage();
		if (language.indexOf('-') !== -1) {
			if (!_.findWhere(this.supportedLanguages, { language })) {
				return language.substr(0, 2);
			}
		}
		return language;
	},

	translateAttachments(attachments, language) {
		for (const attachment of attachments) {
			if (attachment.author_name !== username) {
				if (attachment.text && attachment.translations && attachment.translations[language]) {
					attachment.text = attachment.translations[language];
				}

				if (attachment.description && attachment.translations && attachment.translations[language]) {
					attachment.description = attachment.translations[language];
				}

				if (attachment.attachments && attachment.attachments.length > 0) {
					attachment.attachments = this.translateAttachments(attachment.attachments, language);
				}
			}
		}
		return attachments;
	},

	init() {
		if (this.initialized) {
			return;
		}

		Tracker.autorun(async (c) => {
			const uid = Meteor.userId();
			if (!uid || !hasPermission('auto-translate')) {
				return;
			}

			c.stop();

			[this.providersMetadata, this.supportedLanguages] = await Promise.all([
				callWithErrorHandling('autoTranslate.getProviderUiMetadata'),
				callWithErrorHandling('autoTranslate.getSupportedLanguages', 'en'),
			]);
		});

		Subscriptions.find().observeChanges({
			changed: (id, fields) => {
				if (fields.hasOwnProperty('autoTranslate') || fields.hasOwnProperty('autoTranslateLanguage')) {
					mem.clear(this.findSubscriptionByRid);
				}
			},
		});

		this.initialized = true;
	},
};

export const createAutoTranslateMessageRenderer = () => {
	AutoTranslate.init();

	return (message) => {
		const subscription = AutoTranslate.findSubscriptionByRid(message.rid);
		const autoTranslateLanguage = AutoTranslate.getLanguage(message.rid);
		if (message.u && message.u._id !== Meteor.userId()) {
			if (!message.translations) {
				message.translations = {};
			}
			if (!!(subscription && subscription.autoTranslate) !== !!message.autoTranslateShowInverse) {
				message.translations.original = message.html;
				if (message.translations[autoTranslateLanguage]) {
					message.html = message.translations[autoTranslateLanguage];
				}

				if (message.attachments && message.attachments.length > 0) {
					message.attachments = AutoTranslate.translateAttachments(message.attachments, autoTranslateLanguage);
				}
			}
		} else if (message.attachments && message.attachments.length > 0) {
			message.attachments = AutoTranslate.translateAttachments(message.attachments, autoTranslateLanguage);
		}
		return message;
	};
};

export const createAutoTranslateMessageStreamHandler = () => {
	AutoTranslate.init();

	return (message) => {
		if (message.u && message.u._id !== Meteor.userId()) {
			const subscription = AutoTranslate.findSubscriptionByRid(message.rid);
			const language = AutoTranslate.getLanguage(message.rid);
			if (
				subscription &&
				subscription.autoTranslate === true &&
				message.msg &&
				(!message.translations || !message.translations[language])
			) {
				// || (message.attachments && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; }))
				Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
			} else if (AutoTranslate.messageIdsToWait[message._id] !== undefined && subscription && subscription.autoTranslate !== true) {
				Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true }, $unset: { autoTranslateFetching: true } });
				delete AutoTranslate.messageIdsToWait[message._id];
			} else if (message.autoTranslateFetching === true) {
				Messages.update({ _id: message._id }, { $unset: { autoTranslateFetching: true } });
			}
		}
	};
};
