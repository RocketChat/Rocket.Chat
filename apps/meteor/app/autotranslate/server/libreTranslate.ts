import type { IMessage, MessageAttachment, IProviderMetadata, ITranslationResult, ISupportedLanguage } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import _ from 'underscore';

import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';
import { i18n } from '../../../server/lib/i18n';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../settings/server';

interface ILibreTranslateLanguage {
	code: string;
	name: string;
	targets?: string[];
}

/**
 * LibreTranslate translation service provider class representation.
 * Encapsulates the service provider settings and information.
 * Provides languages supported by the service provider.
 * Resolves API call to a self-hosted (or hosted) LibreTranslate instance to
 * resolve the translation request. Enables fully self-hosted / offline
 * message auto-translation.
 * @class
 * @augments AutoTranslate
 */
class LibreTranslateAutoTranslate extends AutoTranslate {
	apiKey: string;

	apiEndPointUrl: string;

	/**
	 * setup api reference to libretranslate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'libre-translate';
		this.apiEndPointUrl = '';
		this.apiKey = '';

		// Base URL of the LibreTranslate instance, e.g. http://libretranslate.example:5000
		settings.watch<string>('AutoTranslate_LibreTranslateAPIURL', (value) => {
			this.apiEndPointUrl = (value || '').replace(/\/$/, '');
		});

		// Optional — only required when the instance enforces API keys.
		settings.watch<string>('AutoTranslate_LibreTranslateAPIKey', (value) => {
			this.apiKey = value;
		});
	}

	/**
	 * Returns metadata information about the service provider.
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getProviderMetadata(): IProviderMetadata {
		return {
			name: this.name,
			displayName: i18n.t('AutoTranslate_LibreTranslate'),
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
	 * Fetches the languages exposed by the configured LibreTranslate instance.
	 * @private implements super abstract method.
	 * @param {string} target
	 * @returns {object} code : value pair
	 */
	async getSupportedLanguages(target: string): Promise<ISupportedLanguage[]> {
		if (!this.apiEndPointUrl) {
			return [];
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}

		// SECURITY: the URL is a setting set by an admin. It's safe to disable this check.
		const request = await fetch(`${this.apiEndPointUrl}/languages`, {
			ignoreSsrfValidation: true,
		});
		if (!request.ok) {
			throw new Error('Failed to fetch supported languages');
		}

		const result = (await request.json()) as ILibreTranslateLanguage[];

		this.supportedLanguages[target || 'en'] = result.map(({ code, name }) => ({
			language: new Intl.Locale(code).toString(),
			name,
		}));
		return this.supportedLanguages[target || 'en'];
	}

	/**
	 * Send Request REST API call to the service provider.
	 * `q` is sent as an array of lines; LibreTranslate then returns
	 * `translatedText` as an array (one entry per input line).
	 * @private
	 * @param {string[]} lines
	 * @param {string} targetLanguage
	 * @returns {string | null} the joined translated text, or null on failure
	 */
	private async _query(lines: string[], targetLanguage: string): Promise<string | null> {
		const body: Record<string, unknown> = {
			q: lines,
			source: 'auto',
			target: targetLanguage,
			format: 'text',
		};
		if (this.apiKey) {
			body.api_key = this.apiKey;
		}

		// SECURITY: the URL is a setting set by an admin. It's safe to disable this check.
		const result = await fetch(`${this.apiEndPointUrl}/translate`, {
			method: 'POST',
			ignoreSsrfValidation: true,
			headers: { 'Content-Type': 'application/json' },
			body,
		});

		if (!result.ok) {
			throw new Error(result.statusText);
		}

		const json = (await result.json()) as { translatedText?: string | string[] };
		if (json.translatedText === undefined) {
			return null;
		}
		return Array.isArray(json.translatedText) ? json.translatedText.join('\n') : json.translatedText;
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
		for (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const translatedText = await this._query(msgs, language);
				if (translatedText !== null) {
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
		for (let language of targetLanguages) {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			try {
				const translatedText = await this._query([attachment.description || attachment.text || ''], language);
				if (translatedText !== null) {
					translations[language] = translatedText;
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error translating message attachment', err });
			}
		}
		return translations;
	}
}

// Register LibreTranslate translation provider to the registry.
TranslationProviderRegistry.registerProvider(new LibreTranslateAutoTranslate());
