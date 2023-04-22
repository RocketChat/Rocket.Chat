/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import type {
	IMessage,
	IProviderMetadata,
	ISupportedLanguage,
	ITranslationResult,
	IGoogleTranslation,
	MessageAttachment,
} from '@rocket.chat/core-typings';

import { AutoTranslate, TranslationProviderRegistry } from './autotranslate';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../settings/server';
import { fetch } from '../../../server/lib/http/fetch';

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
			displayName: TAPi18n.__('AutoTranslate_Google'),
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

		let result;
		const params = {
			key: this.apiKey,
			...(target && { target }),
		};

		try {
			const request = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?${new URLSearchParams(params)}`);
			result = await request.json();
		} catch (e: any) {
			// Fallback: Get the English names of the target languages
			if (
				e.response &&
				e.response.statusCode === 400 &&
				e.response.data &&
				e.response.data.error &&
				e.response.data.error.status === 'INVALID_ARGUMENT'
			) {
				params.target = 'en';
				target = 'en';
				if (!this.supportedLanguages[target]) {
					const request = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?${new URLSearchParams(params)}`);
					result = await request.json();
				}
			}
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}
		this.supportedLanguages[target || 'en'] = result?.data?.data?.languages;
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
		let msgs = message.msg.split('\n');
		msgs = msgs.map((msg) => encodeURIComponent(msg));

		const query = `q=${msgs.join('&q=')}`;
		const supportedLanguages = await this.getSupportedLanguages('en');

		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}

			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language,
						format: 'text',
					},
					query,
				});

				if (
					result.statusCode === 200 &&
					result.data &&
					result.data.data &&
					result.data.data.translations &&
					Array.isArray(result.data.data.translations) &&
					result.data.data.translations.length > 0
				) {
					const txt = result.data.data.translations.map((translation: IGoogleTranslation) => translation.translatedText).join('\n');
					translations[language] = this.deTokenize(Object.assign({}, message, { msg: txt }));
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error translating message', err });
			}
		});
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
		const query = `q=${encodeURIComponent(attachment.description || attachment.text || '')}`;
		const supportedLanguages = await this.getSupportedLanguages('en');

		targetLanguages.forEach((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}

			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language,
						format: 'text',
					},
					query,
				});

				if (
					result.statusCode === 200 &&
					result.data &&
					result.data.data &&
					result.data.data.translations &&
					Array.isArray(result.data.data.translations) &&
					result.data.data.translations.length > 0
				) {
					translations[language] = result.data.data.translations
						.map((translation: IGoogleTranslation) => translation.translatedText)
						.join('\n');
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error translating message', err });
			}
		});
		return translations;
	}
}

// Register Google translation provider.
TranslationProviderRegistry.registerProvider(new GoogleAutoTranslate());
