/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import type {
	IMessage,
	IDeepLTranslation,
	MessageAttachment,
	IProviderMetadata,
	ITranslationResult,
	ISupportedLanguage,
} from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import _ from 'underscore';

import { i18n } from '../../../server/lib/i18n';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../settings/server';
import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';

const proApiEndpoint = 'https://api.deepl.com/v2/translate';
const freeApiEndpoint = 'https://api-free.deepl.com/v2/translate';

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
		this.apiEndPointUrl = proApiEndpoint;

		// Get the service provide API key.
		settings.watch<string>('AutoTranslate_DeepLAPIKey', (value) => {
			this.apiKey = value;

			// if the api key ends with `:fx` it is a free api key
			if (/:fx$/.test(value)) {
				this.apiEndPointUrl = freeApiEndpoint;
				return;
			}
			this.apiEndPointUrl = proApiEndpoint;
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
			displayName: i18n.t('AutoTranslate_DeepL'),
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
	async getSupportedLanguages(target: string): Promise<ISupportedLanguage[]> {
		if (!this.apiKey) {
			return [];
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}
		this.supportedLanguages[target] = [
			{
				language: 'bg',
				name: i18n.t('Language_Bulgarian', { lng: target }),
			},
			{
				language: 'cs',
				name: i18n.t('Language_Czech', { lng: target }),
			},
			{
				language: 'da',
				name: i18n.t('Language_Danish', { lng: target }),
			},
			{
				language: 'de',
				name: i18n.t('Language_German', { lng: target }),
			},
			{
				language: 'el',
				name: i18n.t('Language_Greek', { lng: target }),
			},
			{
				language: 'en',
				name: i18n.t('Language_English', { lng: target }),
			},
			{
				language: 'es',
				name: i18n.t('Language_Spanish', { lng: target }),
			},
			{
				language: 'et',
				name: i18n.t('Language_Estonian', { lng: target }),
			},
			{
				language: 'fi',
				name: i18n.t('Language_Finnish', { lng: target }),
			},
			{
				language: 'fr',
				name: i18n.t('Language_French', { lng: target }),
			},
			{
				language: 'hu',
				name: i18n.t('Language_Hungarian', { lng: target }),
			},
			{
				language: 'it',
				name: i18n.t('Language_Italian', { lng: target }),
			},
			{
				language: 'ja',
				name: i18n.t('Language_Japanese', { lng: target }),
			},
			{
				language: 'lt',
				name: i18n.t('Language_Lithuanian', { lng: target }),
			},
			{
				language: 'lv',
				name: i18n.t('Language_Latvian', { lng: target }),
			},
			{
				language: 'nl',
				name: i18n.t('Language_Dutch', { lng: target }),
			},
			{
				language: 'pl',
				name: i18n.t('Language_Polish', { lng: target }),
			},
			{
				language: 'pt',
				name: i18n.t('Language_Portuguese', { lng: target }),
			},
			{
				language: 'ro',
				name: i18n.t('Language_Romanian', { lng: target }),
			},
			{
				language: 'ru',
				name: i18n.t('Language_Russian', { lng: target }),
			},
			{
				language: 'sk',
				name: i18n.t('Language_Slovak', { lng: target }),
			},
			{
				language: 'sl',
				name: i18n.t('Language_Slovenian', { lng: target }),
			},
			{
				language: 'sv',
				name: i18n.t('Language_Swedish', { lng: target }),
			},
			{
				language: 'zh',
				name: i18n.t('Language_Chinese', { lng: target }),
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
	async _translateMessage(message: IMessage, targetLanguages: string[]): Promise<ITranslationResult> {
		const translations: { [k: string]: string } = {};
		const msgs = message.msg.split('\n');
		const supportedLanguages = await this.getSupportedLanguages('en');
		for await (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = await fetch(this.apiEndPointUrl, {
					params: { target_lang: language, text: msgs },
					headers: {
						Authorization: `DeepL-Auth-Key ${this.apiKey}`,
					},
					method: 'POST',
				});

				if (!result.ok) {
					throw new Error(result.statusText);
				}

				const body = await result.json();

				if (result.status === 200 && body.translations && Array.isArray(body.translations) && body.translations.length > 0) {
					// store translation only when the source and target language are different.
					// multiple lines might contain different languages => Mix the text between source and detected target if neccessary
					const translatedText = body.translations
						.map((translation: IDeepLTranslation, index: number) =>
							translation.detected_source_language !== language ? translation.text : msgs[index],
						)
						.join('\n');
					translations[language] = this.deTokenize(Object.assign({}, message, { msg: translatedText }));
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error translating message', err });
			}
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
	async _translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): Promise<ITranslationResult> {
		const translations: { [k: string]: string } = {};
		const supportedLanguages = await this.getSupportedLanguages('en');
		for await (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = await fetch(this.apiEndPointUrl, {
					params: {
						auth_key: this.apiKey,
						target_lang: language,
						text: attachment.description || attachment.text || '',
					},
				});
				if (!result.ok) {
					throw new Error(result.statusText);
				}
				const body = await result.json();
				if (result.status === 200 && body.translations && Array.isArray(body.translations) && body.translations.length > 0) {
					if (body.translations.map((translation: IDeepLTranslation) => translation.detected_source_language).join() !== language) {
						translations[language] = body.translations.map((translation: IDeepLTranslation) => translation.text);
					}
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error translating message attachment', err });
			}
		}
		return translations;
	}
}

// Register DeepL translation provider to the registry.
TranslationProviderRegistry.registerProvider(new DeeplAutoTranslate());
