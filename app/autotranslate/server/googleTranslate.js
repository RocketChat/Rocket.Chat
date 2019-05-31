/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { TAPi18n } from 'meteor/tap:i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';

import { AutoTranslate, TranslationProviderRegistry } from './autotranslate';
import { SystemLogger } from '../../logger/server';

/**
 * Represents google translate class
 * @class
 * @augments AutoTranslate
 */
class GoogleAutoTranslate extends AutoTranslate {
	/**
	 * setup api reference to Google translate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'google-translate';
		// this.apiEndPointUrl = 'https://translation.googleapis.com/language/translate/v2';
	}

	/**
	 * Returns metadata information about the service provider
	 * @private implements super abstract method.
	 * @returns {object}
	 */
	_getProviderMetadata() {
		return {
			name: this.name,
			displayName: TAPi18n.__('AutoTranslate_Google'),
			settings: this._getSettings(),
		};
	}

	/**
	 * Returns necessary settings information about the translation service provider.
	 * @private implements super abstract method.
	 * @returns {object}
	 */
	_getSettings() {
		return {
			apiKey: this.apiKey,
			apiEndPointUrl: this.apiEndPointUrl,
		};
	}

	/**
	 * Returns supported languages for translation by the active service provider.
	 * Google Translate api provides the list of supported languages.
	 * @private implements super abstract method.
	 * @param {string} target : user language setting or 'en'
	 * @returns {object} code : value pair
	 */
	getSupportedLanguages(target) {
		if (this.autoTranslateEnabled && this.apiKey) {
			if (this.supportedLanguages[target]) {
				return this.supportedLanguages[target];
			}
			let result;
			const params = { key: this.apiKey };
			if (target) {
				params.target = target;
			}

			try {
				result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', { params });
			} catch (e) {
				if (e.response && e.response.statusCode === 400 && e.response.data && e.response.data.error && e.response.data.error.status === 'INVALID_ARGUMENT') {
					params.target = 'en';
					target = 'en';
					if (!this.supportedLanguages[target]) {
						result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', { params });
					}
				}
			} finally {
				if (this.supportedLanguages[target]) {
					// eslint-disable-next-line no-unsafe-finally
					return this.supportedLanguages[target];
				}
				this.supportedLanguages[target || 'en'] = result && result.data && result.data.data && result.data.data.languages;
				// eslint-disable-next-line no-unsafe-finally
				return this.supportedLanguages[target || 'en'];
			}
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
		const query = `q=${ msgs.join('&q=') }`;
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language,
					},
					query,
				});
				if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
					const txt = result.data.data.translations.map((translation) => translation.translatedText).join('\n');
					translations[language] = this.deTokenize(Object.assign({}, message, { msg: txt }));
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
		const query = `q=${ encodeURIComponent(attachment.description || attachment.text) }`;
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language,
					},
					query,
				});
				if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
					translations[language] = result.data.data.translations.map((translation) => translation.translatedText).join('\n');
				}
			} catch (e) {
				SystemLogger.error('Error translating message', e);
			}
		});
		return translations;
	}
}

// Register Google translation provider.
TranslationProviderRegistry.registerProvider(new GoogleAutoTranslate());
