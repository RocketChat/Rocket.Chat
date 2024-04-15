/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import type {
	IMessage,
	IProviderMetadata,
	ISupportedLanguage,
	ITranslationResult,
	IGoogleTranslation,
	MessageAttachment,
} from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { i18n } from '../../../server/lib/i18n';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../settings/server';
import { AutoTranslate, TranslationProviderRegistry } from './autotranslate';

/**
 * Represents google translate class
 * @class
 * @augments AutoTranslate
 */

class GoogleAutoTranslate extends AutoTranslate {
	apiKey: string;

	apiEndPointUrl: string;

	/**
	 * setup api reference to Google translate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'google-translate';
		this.apiEndPointUrl = 'https://translation.googleapis.com/language/translate/v2';
		// Get the service provide API key.
		settings.watch<string>('AutoTranslate_GoogleAPIKey', (value) => {
			this.apiKey = value;
		});
	}

	/**
	 * Returns metadata information about the service provider
	 * @private implements super abstract method.
	 * @returns {object}
	 */
	_getProviderMetadata(): IProviderMetadata {
		return {
			name: this.name,
			displayName: i18n.t('AutoTranslate_Google'),
			settings: this._getSettings(),
		};
	}

	/**
	 * Returns necessary settings information about the translation service provider.
	 * @private implements super abstract method.
	 * @returns {object}
	 */
	_getSettings(): IProviderMetadata['settings'] {
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
	async getSupportedLanguages(target: string): Promise<ISupportedLanguage[]> {
		if (!this.apiKey) {
			return [];
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}

		let result: { data?: { languages: ISupportedLanguage[] } } = {};
		const params = {
			key: this.apiKey,
			...(target && { target }),
		};

		try {
			const request = await fetch(`https://translation.googleapis.com/language/translate/v2/languages`, { params });
			if (!request.ok && request.status === 400 && request.statusText === 'INVALID_ARGUMENT') {
				throw new Error('Failed to fetch supported languages');
			}

			result = (await request.json()) as typeof result;
		} catch (e: any) {
			// Fallback: Get the English names of the target languages
			if (e.message === 'Failed to fetch supported languages') {
				params.target = 'en';
				target = 'en';
				if (!this.supportedLanguages[target]) {
					const request = await fetch(`https://translation.googleapis.com/language/translate/v2/languages`, { params });
					result = (await request.json()) as typeof result;
				}
			}
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}
		this.supportedLanguages[target || 'en'] = result?.data?.languages || [];
		return this.supportedLanguages[target || 'en'];
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

		const supportedLanguages = await this.getSupportedLanguages('en');

		for await (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !supportedLanguages.find((lang) => lang.language === language)) {
				language = language.substr(0, 2);
			}

			try {
				const result = await fetch(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language,
						format: 'text',
						q: message.msg.split('\n'),
					},
				});
				if (!result.ok) {
					throw new Error(result.statusText);
				}
				const body = await result.json();

				if (
					result.status === 200 &&
					body.data &&
					body.data.translations &&
					Array.isArray(body.data.translations) &&
					body.data.translations.length > 0
				) {
					const txt = body.data.translations.map((translation: IGoogleTranslation) => translation.translatedText).join('\n');
					translations[language] = this.deTokenize(Object.assign({}, message, { msg: txt }));
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
	 * @returns {object} translated attachment descriptions for each target language
	 */
	async _translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): Promise<ITranslationResult> {
		const translations: { [k: string]: string } = {};
		const supportedLanguages = await this.getSupportedLanguages('en');

		for await (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !supportedLanguages.find((lang) => lang.language === language)) {
				language = language.substr(0, 2);
			}

			try {
				const result = await fetch(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language,
						format: 'text',
						q: attachment.description || attachment.text || '',
					},
				});
				if (!result.ok) {
					throw new Error(result.statusText);
				}
				const body = await result.json();

				if (
					result.status === 200 &&
					body.data &&
					body.data.translations &&
					Array.isArray(body.data.translations) &&
					body.data.translations.length > 0
				) {
					translations[language] = body.data.translations.map((translation: IGoogleTranslation) => translation.translatedText).join('\n');
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error translating message', err });
			}
		}
		return translations;
	}
}

// Register Google translation provider.
TranslationProviderRegistry.registerProvider(new GoogleAutoTranslate());
