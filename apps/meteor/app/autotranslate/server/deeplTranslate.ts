/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */
import _ from 'underscore';
import type {
	IMessage,
	IDeepLTranslation,
	MessageAttachment,
	IProviderMetadata,
	ITranslationResult,
	ISupportedLanguage,
} from '@rocket.chat/core-typings';
import { Translation } from '@rocket.chat/core-services';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

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
	async _getProviderMetadata(): Promise<IProviderMetadata> {
		return {
			name: this.name,
			displayName: await Translation.translateToServerLanguage('AutoTranslate_DeepL'),
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
				name: await Translation.translateText('Language_Bulgarian', target),
			},
			{
				language: 'cs',
				name: await Translation.translateText('Language_Czech', target),
			},
			{
				language: 'da',
				name: await Translation.translateText('Language_Danish', target),
			},
			{
				language: 'de',
				name: await Translation.translateText('Language_German', target),
			},
			{
				language: 'el',
				name: await Translation.translateText('Language_Greek', target),
			},
			{
				language: 'en',
				name: await Translation.translateText('Language_English', target),
			},
			{
				language: 'es',
				name: await Translation.translateText('Language_Spanish', target),
			},
			{
				language: 'et',
				name: await Translation.translateText('Language_Estonian', target),
			},
			{
				language: 'fi',
				name: await Translation.translateText('Language_Finnish', target),
			},
			{
				language: 'fr',
				name: await Translation.translateText('Language_French', target),
			},
			{
				language: 'hu',
				name: await Translation.translateText('Language_Hungarian', target),
			},
			{
				language: 'it',
				name: await Translation.translateText('Language_Italian', target),
			},
			{
				language: 'ja',
				name: await Translation.translateText('Language_Japanese', target),
			},
			{
				language: 'lt',
				name: await Translation.translateText('Language_Lithuanian', target),
			},
			{
				language: 'lv',
				name: await Translation.translateText('Language_Latvian', target),
			},
			{
				language: 'nl',
				name: await Translation.translateText('Language_Dutch', target),
			},
			{
				language: 'pl',
				name: await Translation.translateText('Language_Polish', target),
			},
			{
				language: 'pt',
				name: await Translation.translateText('Language_Portuguese', target),
			},
			{
				language: 'ro',
				name: await Translation.translateText('Language_Romanian', target),
			},
			{
				language: 'ru',
				name: await Translation.translateText('Language_Russian', target),
			},
			{
				language: 'sk',
				name: await Translation.translateText('Language_Slovak', target),
			},
			{
				language: 'sl',
				name: await Translation.translateText('Language_Slovenian', target),
			},
			{
				language: 'sv',
				name: await Translation.translateText('Language_Swedish', target),
			},
			{
				language: 'zh',
				name: await Translation.translateText('Language_Chinese', target),
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
		let msgs = message.msg.split('\n');
		msgs = msgs.map((msg) => encodeURIComponent(msg));
		const supportedLanguages = await this.getSupportedLanguages('en');
		for await (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const result = await fetch(this.apiEndPointUrl, { params: { auth_key: this.apiKey, target_lang: language, text: msgs } });

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
						text: encodeURIComponent(attachment.description || attachment.text || ''),
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
await TranslationProviderRegistry.registerProvider(new DeeplAutoTranslate());
