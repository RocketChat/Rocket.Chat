/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import {
	IMessage,
	IDeepLTranslation,
	MessageAttachment,
	IProviderMetadata,
	ITranslationResult,
	ISupportedLanguage,
} from '@rocket.chat/core-typings';

import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../settings/server';

/**
 * DeepL translation service provider class representation.
 * Encapsulates the service provider settings and information.
 * Provides languages supported by the service provider.
 * Resolves API call to service provider to resolve the translation request.
 * @class
 * @augments AutoTranslate
 */
class DeeplAutoTranslate extends AutoTranslate {
	apiKey: string;

	apiEndPointUrl: string;

	/**
	 * setup api reference to deepl translate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'deepl-translate';
		this.apiEndPointUrl = 'https://api.deepl.com/v2/translate';
		// Get the service provide API key.
		settings.watch<string>('AutoTranslate_DeepLAPIKey', (value) => {
			this.apiKey = value;
		});
	}

	/**
	 * Returns metadata information about the service provide
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getProviderMetadata(): IProviderMetadata {
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
	_getSettings(): IProviderMetadata['settings'] {
		return {
			apiKey: this.apiKey,
			apiEndPointUrl: this.apiEndPointUrl,
		};
	}

	/**
	 * Returns supported languages for translation by the active service provider.
	 * Deepl does not provide an endpoint yet to retrieve the supported languages.
	 * So each supported languages are explicitly maintained.
	 * @private implements super abstract method.
	 * @param {string} target
	 * @returns {object} code : value pair
	 */
	getSupportedLanguages(target: string): ISupportedLanguage[] {
		if (!this.apiKey) {
			return [];
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}
		this.supportedLanguages[target] = [
			{
				language: 'bg',
				name: TAPi18n.__('Language_Bulgarian', { lng: target }),
			},
			{
				language: 'cs',
				name: TAPi18n.__('Language_Czech', { lng: target }),
			},
			{
				language: 'da',
				name: TAPi18n.__('Language_Danish', { lng: target }),
			},
			{
				language: 'de',
				name: TAPi18n.__('Language_German', { lng: target }),
			},
			{
				language: 'el',
				name: TAPi18n.__('Language_Greek', { lng: target }),
			},
			{
				language: 'en',
				name: TAPi18n.__('Language_English', { lng: target }),
			},
			{
				language: 'es',
				name: TAPi18n.__('Language_Spanish', { lng: target }),
			},
			{
				language: 'et',
				name: TAPi18n.__('Language_Estonian', { lng: target }),
			},
			{
				language: 'fi',
				name: TAPi18n.__('Language_Finnish', { lng: target }),
			},
			{
				language: 'fr',
				name: TAPi18n.__('Language_French', { lng: target }),
			},
			{
				language: 'hu',
				name: TAPi18n.__('Language_Hungarian', { lng: target }),
			},
			{
				language: 'it',
				name: TAPi18n.__('Language_Italian', { lng: target }),
			},
			{
				language: 'ja',
				name: TAPi18n.__('Language_Japanese', { lng: target }),
			},
			{
				language: 'lt',
				name: TAPi18n.__('Language_Lithuanian', { lng: target }),
			},
			{
				language: 'lv',
				name: TAPi18n.__('Language_Latvian', { lng: target }),
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
				language: 'ro',
				name: TAPi18n.__('Language_Romanian', { lng: target }),
			},
			{
				language: 'ru',
				name: TAPi18n.__('Language_Russian', { lng: target }),
			},
			{
				language: 'sk',
				name: TAPi18n.__('Language_Slovak', { lng: target }),
			},
			{
				language: 'sl',
				name: TAPi18n.__('Language_Slovenian', { lng: target }),
			},
			{
				language: 'sv',
				name: TAPi18n.__('Language_Swedish', { lng: target }),
			},
			{
				language: 'zh',
				name: TAPi18n.__('Language_Chinese', { lng: target }),
			},
		];

		return this.supportedLanguages[target];
	}

	/**
	 * Send Request REST API call to the service provider.
	 * Returns translated message for each target language in target languages.
	 * @private
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @returns {object} translations: Translated messages for each language
	 */
	_translateMessage(message: IMessage, targetLanguages: string[]): ITranslationResult {
		const translations: { [k: string]: string } = {};
		let msgs = message.msg.split('\n');
		msgs = msgs.map((msg) => encodeURIComponent(msg));
		const query = `text=${msgs.join('&text=')}`;
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						// eslint-disable-next-line @typescript-eslint/camelcase
						auth_key: this.apiKey,
						// eslint-disable-next-line @typescript-eslint/camelcase
						target_lang: language,
					},
					query,
				});

				if (
					result.statusCode === 200 &&
					result.data &&
					result.data.translations &&
					Array.isArray(result.data.translations) &&
					result.data.translations.length > 0
				) {
					// store translation only when the source and target language are different.
					// multiple lines might contain different languages => Mix the text between source and detected target if neccessary
					const translatedText = result.data.translations
						.map((translation: IDeepLTranslation, index: number) =>
							translation.detected_source_language !== language ? translation.text : msgs[index],
						)
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
	_translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): ITranslationResult {
		const translations: { [k: string]: string } = {};
		const query = `text=${encodeURIComponent(attachment.description || attachment.text || '')}`;
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						// eslint-disable-next-line @typescript-eslint/camelcase
						auth_key: this.apiKey,
						// eslint-disable-next-line @typescript-eslint/camelcase
						target_lang: language,
					},
					query,
				});
				if (
					result.statusCode === 200 &&
					result.data &&
					result.data.translations &&
					Array.isArray(result.data.translations) &&
					result.data.translations.length > 0
				) {
					if (result.data.translations.map((translation: IDeepLTranslation) => translation.detected_source_language).join() !== language) {
						translations[language] = result.data.translations.map((translation: IDeepLTranslation) => translation.text);
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
