import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { settings } from '../../../settings/server';
import { Messages } from '../../../models/server';

API.v1.addRoute(
	'autotranslate.getSupportedLanguages',
	{ authRequired: true },
	{
		get() {
			if (!settings.get('AutoTranslate_Enabled')) {
				return API.v1.failure('AutoTranslate is disabled.');
			}
			const { targetLanguage } = this.queryParams;
			const languages = Meteor.runAsUser(this.userId, () => Meteor.call('autoTranslate.getSupportedLanguages', targetLanguage));

			return API.v1.success({ languages: languages || [] });
		},
	},
);

API.v1.addRoute(
	'autotranslate.saveSettings',
	{ authRequired: true },
	{
		post() {
			const { roomId, field, value, defaultLanguage } = this.bodyParams;
			if (!settings.get('AutoTranslate_Enabled')) {
				return API.v1.failure('AutoTranslate is disabled.');
			}

			if (!roomId) {
				return API.v1.failure('The bodyParam "roomId" is required.');
			}
			if (!field) {
				return API.v1.failure('The bodyParam "field" is required.');
			}
			if (value === undefined) {
				return API.v1.failure('The bodyParam "value" is required.');
			}
			if (field === 'autoTranslate' && typeof value !== 'boolean') {
				return API.v1.failure('The bodyParam "autoTranslate" must be a boolean.');
			}
			if (field === 'autoTranslateLanguage' && typeof value !== 'string') {
				return API.v1.failure('The bodyParam "autoTranslateLanguage" must be a string.');
			}

			Meteor.runAsUser(this.userId, () =>
				Meteor.call('autoTranslate.saveSettings', roomId, field, value === true ? '1' : String(value).valueOf(), { defaultLanguage }),
			);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'autotranslate.translateMessage',
	{ authRequired: true },
	{
		post() {
			const { messageId, targetLanguage } = this.bodyParams;
			if (!settings.get('AutoTranslate_Enabled')) {
				return API.v1.failure('AutoTranslate is disabled.');
			}
			if (!messageId) {
				return API.v1.failure('The bodyParam "messageId" is required.');
			}
			const message = Messages.findOneById(messageId);
			if (!message) {
				return API.v1.failure('Message not found.');
			}

			const translatedMessage = Meteor.runAsUser(this.userId, () => Meteor.call('autoTranslate.translateMessage', message, targetLanguage));

			return API.v1.success({ message: translatedMessage });
		},
	},
);
