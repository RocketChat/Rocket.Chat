/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { Meteor } from 'meteor/meteor';
import { TranslationProviderRegistry, AutoTranslate } from 'meteor/rocketchat:autotranslate';
import { SystemLogger } from 'meteor/rocketchat:logger';
import { Promise } from 'meteor/promise';
import { TAPi18n } from 'meteor/tap:i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';

const cld = Npm.require('cld'); // import the local package dependencies

/**
 * Intergrate DBS translation service
 * @class
 * @augments AutoTranslate
 */
class DBSAutoTranslate extends AutoTranslate {
	/**
	 * Encapsulate service provider name and invokes parent constructor.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'dbs-translate';
	}

	/**
	 * Returns metadata information of the service provider
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getProviderMetadata() {
		return {
			name: this.name,
			displayName: TAPi18n.__('AutoTranslate_DBS'),
			settings: this._getSettings(),
		};
	}

	/**
	 * Returns necessary settings information about the translation service provider.
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getSettings() {
		return {
			apiKey: this.apiKey,
			apiEndPointUrl: this.apiEndPointUrl,
		};
	}

	/**
	 * Returns supported languages for translation by the active service provider.
	 * @private implements super abstract method.
	 * @param {string} target
	 * @returns {object} code : value pair
	 */
	getSupportedLanguages(target) {
		if (this.autoTranslateEnabled && this.apiKey) {
			if (this.supportedLanguages[target]) {
				return this.supportedLanguages[target];
			}
			return this.supportedLanguages[target] = [
				{
					language: 'de',
					name: TAPi18n.__('German', { lng: target }),
				},
				{
					language: 'en',
					name: TAPi18n.__('English', { lng: target }),
				},
				{
					language: 'fr',
					name: TAPi18n.__('French', { lng: target }),
				},
				{
					language: 'es',
					name: TAPi18n.__('Spanish', { lng: target }),
				},
				{
					language: 'it',
					name: TAPi18n.__('Italian', { lng: target }),
				},
				{
					language: 'nl',
					name: TAPi18n.__('Dutch', { lng: target }),
				},
				{
					language: 'pl',
					name: TAPi18n.__('Polish', { lng: target }),
				},
				{
					language: 'ro',
					name: TAPi18n.__('Romanian', { lng: target }),
				},
				{
					language: 'sk',
					name: TAPi18n.__('Slovak', { lng: target }),
				},
				{
					language: 'ja',
					name: TAPi18n.__('Japanese', { lng: target }),
				},
				{
					language: 'zh',
					name: TAPi18n.__('Chinese', { lng: target }),
				},
			];
		}
	}

	/**
	 * Send Request REST API call to the service provider.
	 * Returns translated message for each target language in target languages.
	 * @private
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @returns {object} translations: Translated messages for each language
	 */
	_translateMessage(message, targetLanguages) {
		const translations = {};
		const msgs = message.msg.split('\n');
		const query = msgs.join();
		/**
		 * Service provider do not handle the text language detection automatically rather it requires the source language to be specified
		 * explicitly. To automate this language detection process we used the cld language detector.
		 * When the language detector fails, log it.
		 */
		cld.detect(query, (err, result) => {
			if (result && result.languages && result.languages[0]) {
				const sourceLanguage = result.languages[0].code;
				const supportedLanguages = this.getSupportedLanguages('en');
				targetLanguages.forEach((language) => {
					if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
						language = language.substr(0, 2);
					}
					try {
						const result = HTTP.call('POST', `${ this.apiEndPointUrl }/translate`, {
							params: {
								key: this.apiKey,
							}, data: {
								text: query,
								to: language,
								from: sourceLanguage,
							},
						});
						if (result.statusCode === 200 && result.data && result.data.translation && result.data.translation.length > 0) {
							translations[language] = this.deTokenize(Object.assign({}, message, { msg: decodeURIComponent(result.data.translation) }));
						}
					} catch (e) {
						throw new Meteor.Error('translation-failed', 'Error translating message', e);
					}
				});
			} else {
				SystemLogger.warn('Text language could not be determined', err.message);
			}
		});
		return translations;
	}

	/**
	 * Returns translated message attachment description in target languages.
	 * @private
	 * @param {object} attachment
	 * @param {object} targetLanguages
	 * @returns {object} translated messages for each target language
	 */
	_translateAtachment(attachment, targetLanguages) {
		const translations = {};
		const query = attachment.description || attachment.text;
		/**
		 * Service provider do not handle the text language detection automatically rather it requires the source language to be specified
		 * explicitly. To automate this language detection process we used the cld language detector.
		 * When the language detector fails, log it.
		 */
		Promise.await(cld.detect(query, (err, result) => {
			if (result && result.languages && result.languages[0]) {
				const sourceLanguage = result.languages[0].code;
				const supportedLanguages = this.getSupportedLanguages('en');
				targetLanguages.forEach((language) => {
					if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
						language = language.substr(0, 2);
					}
					try {
						const result = HTTP.call('POST', `${ this.apiEndPointUrl }/translate`, {
							params: {
								key: this.apiKey,
							}, data: {
								text: query,
								to: language,
								from: sourceLanguage,
							},
						});
						if (result.statusCode === 200 && result.data && result.data.translation && result.data.translation.length > 0) {
							translations[language] = decodeURIComponent(result.data.translation);
						}
					} catch (e) {
						throw new Meteor.Error('translation-failed', 'Error translating message', e);
					}
				});
			} else {
				SystemLogger.warn('Text language could not be determined', err.message);
			}
		}));
		return translations;
	}
}
// Register provider to the registry.
TranslationProviderRegistry.registerProvider(new DBSAutoTranslate());

