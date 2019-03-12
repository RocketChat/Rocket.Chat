import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Subscriptions, Messages } from '/app/models';
import { callbacks } from '/app/callbacks';
import { settings } from '/app/settings';
import { hasAtLeastOnePermission } from '/app/authorization';
import { CachedCollectionManager } from '/app/ui-cached-collection';
import _ from 'underscore';
import mem from 'mem';

const findSubscriptionByRid = mem((rid) => Subscriptions.findOne({ rid }));

export const AutoTranslate = {
	messageIdsToWait: {},
	supportedLanguages: [],

	getLanguage(rid) {
		let subscription = {};
		if (rid) {
			subscription = findSubscriptionByRid(rid);
		}
		const language = (subscription && subscription.autoTranslateLanguage) || Meteor.user().language || window.defaultUserLanguage();
		if (language.indexOf('-') !== -1) {
			if (!_.findWhere(this.supportedLanguages, { language })) {
				return language.substr(0, 2);
			}
		}
		return language;
	},

	translateAttachments(attachments, language) {
		for (const attachment of attachments) {
			if (attachment.author_name !== Meteor.user().username) {
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
		Meteor.call('autoTranslate.getSupportedLanguages', 'en', (err, languages) => {
			this.supportedLanguages = languages || [];
		});

		Tracker.autorun(() => {
			if (settings.get('AutoTranslate_Enabled') && hasAtLeastOnePermission(['auto-translate'])) {
				callbacks.add('renderMessage', (message) => {
					const subscription = findSubscriptionByRid(message.rid);
					const autoTranslateLanguage = this.getLanguage(message.rid);
					if (message.u && message.u._id !== Meteor.userId()) {
						if (!message.translations) {
							message.translations = {};
						}
						if (subscription && subscription.autoTranslate !== message.autoTranslateShowInverse) {
							message.translations.original = message.html;
							if (message.translations[autoTranslateLanguage]) {
								message.html = message.translations[autoTranslateLanguage];
							}

							if (message.attachments && message.attachments.length > 0) {
								message.attachments = this.translateAttachments(message.attachments, autoTranslateLanguage);
							}
						}
					} else if (message.attachments && message.attachments.length > 0) {
						message.attachments = this.translateAttachments(message.attachments, autoTranslateLanguage);
					}
					return message;
				}, callbacks.priority.HIGH - 3, 'autotranslate');

				callbacks.add('streamMessage', (message) => {
					if (message.u && message.u._id !== Meteor.userId()) {
						const subscription = findSubscriptionByRid(message.rid);
						const language = this.getLanguage(message.rid);
						if (subscription && subscription.autoTranslate === true && ((message.msg && (!message.translations || !message.translations[language])))) { // || (message.attachments && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; }))
							Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						} else if (this.messageIdsToWait[message._id] !== undefined && subscription && subscription.autoTranslate !== true) {
							Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true }, $unset: { autoTranslateFetching: true } });
							delete this.messageIdsToWait[message._id];
						} else if (message.autoTranslateFetching === true) {
							Messages.update({ _id: message._id }, { $unset: { autoTranslateFetching: true } });
						}
					}
				}, callbacks.priority.HIGH - 3, 'autotranslate-stream');
			} else {
				callbacks.remove('renderMessage', 'autotranslate');
				callbacks.remove('streamMessage', 'autotranslate-stream');
			}
		});
	},
};

Meteor.startup(function() {
	CachedCollectionManager.onLogin(() => {
		AutoTranslate.init();
	});
});
