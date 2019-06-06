/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';
import { SystemLogger } from '../../logger/server';
import { TAPi18n } from 'meteor/tap:i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';

/**
 * DeepL translation service provider class representation.
 * Encapsulates the service provider settings and information.
 * Provides languages supported by the service provider.
 * Resolves API call to service provider to resolve the translation request.
 * @class
 * @augments AutoTranslate
 */
class DeeplAutoTranslate extends AutoTranslate {
	/**
	 * setup api reference to deepl translate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'deepl-translate';
		// this.apiEndPointUrl = 'https://api.deepl.com/v1/translate';
	}

	/**
	 * Returns metadata information about the service provide
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getProviderMetadata() {
		return {
			name: this.name,
			displayName: TAPi18n.__('AutoTranslate_DeepL'),
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
					language: 'en',
					name: TAPi18n.__('Language_English', { lng: target }),
				},
				{
					language: 'de',
					name: TAPi18n.__('Language_German', { lng: target }),
				},
				{
					language: 'fr',
					name: TAPi18n.__('Language_French', { lng: target }),
				},
				{
					language: 'es',
					name: TAPi18n.__('Language_Spanish', { lng: target }),
				},
				{
					language: 'it',
					name: TAPi18n.__('Language_Italian', { lng: target }),
				},
				{
					language: 'nl',
					name: TAPi18n.__('Language_Dutch', { lng: target }),
				},
				{
					language: 'pl',
					name: TAPi18n.__('Language_Polish', { lng: target }),
				},
				{
					language: 'pt',
					name: TAPi18n.__('Language_Portuguese', { lng: target }),
				},
				{
					language: 'ru',
					name: TAPi18n.__('Language_Russian', { lng: target }),
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
		let msgs = message.msg.split('\n');
		msgs = msgs.map((msg) => encodeURIComponent(msg));
		const query = `text=${ msgs.join('&text=') }`;
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						auth_key: this.apiKey,
						target_lang: language,
					}, query,
				});

				if (result.statusCode === 200 && result.data && result.data.translations && Array.isArray(result.data.translations) && result.data.translations.length > 0) {
					// store translation only when the source and target language are different.
					// multiple lines might contain different languages => Mix the text between source and detected target if neccessary
					const translatedText = result.data.translations
						.map((translation, index) => (translation.detected_source_language !== language ? translation.text : msgs[index]))
						.join('\n');
					translations[language] = this.deTokenize(Object.assign({}, message, { msg: translatedText }));
				}
			} catch (e) {
				SystemLogger.error('Error translating message', e);
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
		const query = `text=${ encodeURIComponent(attachment.description || attachment.text) }`;
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						auth_key: this.apiKey,
						target_lang: language,
					}, query,
				});
				if (result.statusCode === 200 && result.data && result.data.translations && Array.isArray(result.data.translations) && result.data.translations.length > 0) {
					if (result.data.translations.map((translation) => translation.detected_source_language).join() !== language) {
						translations[language] = result.data.translations.map((translation) => translation.text);
					}
				}
			} catch (e) {
				SystemLogger.error('Error translating message attachment', e);
			}
		});
		return translations;
	}
}

// Register DeepL translation provider to the registry.
TranslationProviderRegistry.registerProvider(new DeeplAutoTranslate());
