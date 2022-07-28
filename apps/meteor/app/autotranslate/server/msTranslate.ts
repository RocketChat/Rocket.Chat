/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import { IMessage, IProviderMetadata, ISupportedLanguage, ITranslationResult, MessageAttachment } from '@rocket.chat/core-typings';

import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';
import { msLogger } from './logger';
import { settings } from '../../settings/server';

/**
 * Microsoft translation service provider class representation.
 * Encapsulates the service provider settings and information.
 * Provides languages supported by the service provider.
 * Resolves API call to service provider to resolve the translation request.
 * @class
 * @augments AutoTranslate
 */
class MsAutoTranslate extends AutoTranslate {
	apiKey: string;

	apiEndPointUrl: string;

	apiDetectText: string;

	apiGetLanguages: string;

	breakSentence: string;

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
		settings.watch<string>('AutoTranslate_MicrosoftAPIKey', (value) => {
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
			displayName: TAPi18n.__('AutoTranslate_Microsoft'),
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
	 * Microsoft does not provide an endpoint yet to retrieve the supported languages.
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
		const languages = HTTP.get(this.apiGetLanguages);
		this.supportedLanguages[target] = Object.keys(languages.data.translation).map((language) => ({
			language,
			name: languages.data.translation[language].name,
		}));
		return this.supportedLanguages[target || 'en'];
	}

	/**
	 * Re-use method for REST API consumption of MS translate.
	 * @private
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @throws Communication Errors
	 * @returns {object} translations: Translated messages for each language
	 */
	_translate(
		data: {
			Text: string;
		}[],
		targetLanguages: string[],
	): ITranslationResult {
		let translations: { [k: string]: string } = {};
		const supportedLanguages = this.getSupportedLanguages('en');
		targetLanguages = targetLanguages.map((language) => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
				language = language.substr(0, 2);
			}
			return language;
		});
		const url = `${this.apiEndPointUrl}&to=${targetLanguages.join('&to=')}`;
		const result = HTTP.post(url, {
			headers: {
				'Ocp-Apim-Subscription-Key': this.apiKey,
				'Content-Type': 'application/json; charset=UTF-8',
			},
			data,
		});

		if (result.statusCode === 200 && result.data && result.data.length > 0) {
			// store translation only when the source and target language are different.
			translations = Object.assign(
				{},
				...targetLanguages.map((language) => ({
					[language]: result.data
						.map(
							(line: { translations: { to: string; text: string }[] }) =>
								line.translations.find((translation) => translation.to === language)?.text,
						)
						.join('\n'),
				})),
			);
		}

		return translations;
	}

	/**
	 * Returns translated message for each target language.
	 * @private
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @returns {object} translations: Translated messages for each language
	 */
	_translateMessage(message: IMessage, targetLanguages: string[]): ITranslationResult {
		// There are multi-sentence-messages where multiple sentences come from different languages
		// This is a problem for translation services since the language detection fails.
		// Thus, we'll split the message in sentences, get them translated, and join them again after translation
		const msgs = message.msg.split('\n').map((msg) => ({ Text: msg }));
		try {
			return this._translate(msgs, targetLanguages);
		} catch (e) {
			msLogger.error({ err: e, msg: 'Error translating message' });
		}
		return {};
	}

	/**
	 * Returns translated message attachment description in target languages.
	 * @private
	 * @param {object} attachment
	 * @param {object} targetLanguages
	 * @returns {object} translated messages for each target language
	 */
	_translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): ITranslationResult {
		try {
			return this._translate(
				[
					{
						Text: attachment.description || attachment.text || '',
					},
				],
				targetLanguages,
			);
		} catch (e) {
			msLogger.error({ err: e, msg: 'Error translating message attachment' });
		}
		return {};
	}
}

// Register Microsoft translation provider to the registry.
TranslationProviderRegistry.registerProvider(new MsAutoTranslate());
