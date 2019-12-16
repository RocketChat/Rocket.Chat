/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { TAPi18n } from 'meteor/tap:i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';

import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';
import { logger } from './logger';
import { settings } from '../../settings';

/**
 * Microsoft translation service provider class representation.
 * Encapsulates the service provider settings and information.
 * Provides languages supported by the service provider.
 * Resolves API call to service provider to resolve the translation request.
 * @class
 * @augments AutoTranslate
 */
class MsAutoTranslate extends AutoTranslate {
	/**
	 * setup api reference to Microsoft translate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'microsoft-translate';
		this.apiEndPointUrl = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
		this.apiDetectText = 'https://api.cognitive.microsofttranslator.com/detect?api-version=3.0';
		this.apiGetLanguages = 'https://api.cognitive.microsofttranslator.com/languages?api-version=3.0';
		this.breakSentence = 'https://api.cognitive.microsofttranslator.com/breaksentence?api-version=3.0';
		// Get the service provide API key.
		settings.get('AutoTranslate_MicrosoftAPIKey', (key, value) => {
			this.apiKey = value;
		});
	}

	/**
	 * Returns metadata information about the service provide
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getProviderMetadata() {
		return {
			name: this.name,
			displayName: TAPi18n.__('AutoTranslate_Microsoft'),
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
	 * Microsoft does not provide an endpoint yet to retrieve the supported languages.
	 * So each supported languages are explicitly maintained.
	 * @private implements super abstract method.
	 * @param {string} target
	 * @returns {object} code : value pair
	 */
	getSupportedLanguages(target) {
		if (this.autoTranslateEnabled && this.apiKey) {
			if (this.supportedLanguages[target]) {
				return this.supportedLanguages[target];
			}
			const languages = HTTP.get(this.apiGetLanguages);
			this.supportedLanguages[target] = Object.keys(languages.data.translation).map((language) => ({
				language,
				name: languages.data.translation[language].name,
			}));
			return this.supportedLanguages[target || 'en'];
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
		let translations = {};
		let msgs = message.msg.split('\n');
		msgs = msgs.map((msg) => ({ Text: msg }));
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages = targetLanguages.map((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			return language;
		});
		const url = `${ this.apiEndPointUrl }&to=${ targetLanguages.join('&to=') }`;
		try {
			const result = HTTP.post(url, {
				headers: {
					'Ocp-Apim-Subscription-Key': this.apiKey,
					'Content-Type': 'application/json; charset=UTF-8',
				},
				data: msgs,
			});

			if (result.statusCode === 200 && result.data && result.data.length > 0) {
				// store translation only when the source and target language are different.
				// multiple lines might contain different languages => Mix the text between source and detected target if neccessary
				translations = Object.assign({}, ...targetLanguages.map((language) =>
					({
						[language]: result.data.map((line) => line.translations.find((translation) => translation.to === language).text).join('\n'),
					})
				));
			}
		} catch (e) {
			logger.microsoft.error('Error translating message', e);
		}
		return translations;
	}

	/**
	 * Returns translated message attachment description in target languages.
	 * @private
	 * @param {object} attachment
	 * @param {object} targetLanguages
	 * @returns {object} translated messages for each target language
	 */
	_translateAttachmentDescriptions(attachment, targetLanguages) {
		let translations = {};
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages = targetLanguages.map((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			return language;
		});
		const url = `${ this.apiEndPointUrl }&to=${ targetLanguages.join('&to=') }`;
		try {
			const result = HTTP.post(url, {
				headers: {
					'Ocp-Apim-Subscription-Key': this.apiKey,
					'Content-Type': 'application/json; charset=UTF-8',
				},
				data: [{
					Text: attachment.description || attachment.text,
				}],
			});

			if (result.statusCode === 200 && result.data && result.data.length > 0) {
				// store translation only when the source and target language are different.
				translations = Object.assign({}, ...targetLanguages.map((language) =>
					({
						[language]: result.data.map((line) => line.translations.find((translation) => translation.to === language).text).join('\n'),
					})
				));
			}
		} catch (e) {
			logger.microsoft.error('Error translating message attachment', e);
		}
		return translations;
	}
}

// Register Microsoft translation provider to the registry.
TranslationProviderRegistry.registerProvider(new MsAutoTranslate());
