import type {
	IMessage,
	IRoom,
	MessageAttachment,
	ISupportedLanguages,
	IProviderMetadata,
	ISupportedLanguage,
	ITranslationResult,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, Subscriptions } from '@rocket.chat/models';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { callbacks } from '../../../lib/callbacks';
import { isTruthy } from '../../../lib/isTruthy';
import { Markdown } from '../../markdown/server';
import { settings } from '../../settings/server';

const translationLogger = new Logger('AutoTranslate');

const Providers = Symbol('Providers');
const Provider = Symbol('Provider');

/**
 * This class allows translation providers to
 * register,load and also returns the active provider.
 */
export class TranslationProviderRegistry {
	static [Providers]: { [k: string]: AutoTranslate } = {};

	static enabled = false;

	static [Provider]: string | null = null;

	/**
	 * Registers the translation provider into the registry.
	 * @param {*} provider
	 */
	static registerProvider(provider: AutoTranslate): void {
		// get provider information
		const metadata = provider._getProviderMetadata();
		if (!metadata) {
			translationLogger.error('Provider metadata is not defined');
			return;
		}

		TranslationProviderRegistry[Providers][metadata.name] = provider;
	}

	/**
	 * Return the active Translation provider
	 */
	static getActiveProvider(): AutoTranslate | null {
		if (!TranslationProviderRegistry.enabled) {
			return null;
		}
		const provider = TranslationProviderRegistry[Provider];
		if (!provider) {
			return null;
		}

		return TranslationProviderRegistry[Providers][provider];
	}

	static async getSupportedLanguages(target: string): Promise<ISupportedLanguage[] | undefined> {
		return TranslationProviderRegistry.enabled ? TranslationProviderRegistry.getActiveProvider()?.getSupportedLanguages(target) : undefined;
	}

	static async translateMessage(message: IMessage, room: IRoom, targetLanguage?: string): Promise<IMessage | null> {
		if (!TranslationProviderRegistry.enabled) {
			return null;
		}

		const provider = TranslationProviderRegistry.getActiveProvider();
		if (!provider) {
			return null;
		}

		return provider.translateMessage(message, room, targetLanguage);
	}

	static getProviders(): AutoTranslate[] {
		return Object.values(TranslationProviderRegistry[Providers]);
	}

	static setCurrentProvider(provider: string): void {
		if (provider === TranslationProviderRegistry[Provider]) {
			return;
		}

		TranslationProviderRegistry[Provider] = provider;

		TranslationProviderRegistry.registerCallbacks();
	}

	static setEnable(enabled: boolean): void {
		TranslationProviderRegistry.enabled = enabled;

		TranslationProviderRegistry.registerCallbacks();
	}

	static registerCallbacks(): void {
		if (!TranslationProviderRegistry.enabled) {
			callbacks.remove('afterSaveMessage', 'autotranslate');
			return;
		}

		const provider = TranslationProviderRegistry.getActiveProvider();
		if (!provider) {
			return;
		}

		callbacks.add('afterSaveMessage', provider.translateMessage.bind(provider), callbacks.priority.MEDIUM, 'autotranslate');
	}
}

/**
 * Generic auto translate base implementation.
 * This class provides generic parts of implementation for
 * tokenization, detokenization, call back register and unregister.
 * @abstract
 * @class
 */
export abstract class AutoTranslate {
	name: string;

	languages: string[];

	supportedLanguages: ISupportedLanguages;

	/**
	 * Encapsulate the api key and provider settings.
	 * @constructor
	 */
	constructor() {
		this.name = '';
		this.languages = [];
		this.supportedLanguages = {};
	}

	/**
	 * Extracts non-translatable parts of a message
	 * @param {object} message
	 * @return {object} message
	 */
	tokenize(message: IMessage): IMessage {
		if (!message.tokens || !Array.isArray(message.tokens)) {
			message.tokens = [];
		}
		message = this.tokenizeEmojis(message);
		message = this.tokenizeCode(message);
		message = this.tokenizeURLs(message);
		message = this.tokenizeMentions(message);
		return message;
	}

	tokenizeEmojis(message: IMessage): IMessage {
		let count = message.tokens?.length || 0;
		message.msg = message.msg.replace(/:[+\w\d]+:/g, (match) => {
			const token = `<i class=notranslate>{${count++}}</i>`;
			message.tokens?.push({
				token,
				text: match,
			});
			return token;
		});

		return message;
	}

	tokenizeURLs(message: IMessage): IMessage {
		let count = message.tokens?.length || 0;

		const schemes = 'http,https';

		// Support ![alt text](http://image url) and [text](http://link)
		message.msg = message.msg.replace(
			new RegExp(`(!?\\[)([^\\]]+)(\\]\\((?:${schemes}):\\/\\/[^\\)]+\\))`, 'gm'),
			(_match, pre, text, post) => {
				const pretoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({
					token: pretoken,
					text: pre,
				});

				const posttoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({
					token: posttoken,
					text: post,
				});

				return pretoken + text + posttoken;
			},
		);

		// Support <http://link|Text>
		message.msg = message.msg.replace(
			new RegExp(`((?:<|&lt;)(?:${schemes}):\\/\\/[^\\|]+\\|)(.+?)(?=>|&gt;)((?:>|&gt;))`, 'gm'),
			(_match, pre, text, post) => {
				const pretoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({
					token: pretoken,
					text: pre,
				});

				const posttoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({
					token: posttoken,
					text: post,
				});

				return pretoken + text + posttoken;
			},
		);

		return message;
	}

	tokenizeCode(message: IMessage): IMessage {
		let count = message.tokens?.length || 0;
		message.html = message.msg;
		message = Markdown.parseMessageNotEscaped(message);

		// Some parsers (e. g. Marked) wrap the complete message in a <p> - this is unnecessary and should be ignored with respect to translations
		const regexWrappedParagraph = new RegExp('^\\s*<p>|</p>\\s*$', 'gm');
		message.msg = message.msg.replace(regexWrappedParagraph, '');

		for (const [tokenIndex, value] of message.tokens?.entries() ?? []) {
			const { token } = value;
			if (token.indexOf('notranslate') === -1) {
				const newToken = `<i class=notranslate>{${count++}}</i>`;
				message.msg = message.msg.replace(token, newToken);
				message.tokens ? (message.tokens[tokenIndex].token = newToken) : undefined;
			}
		}

		return message;
	}

	tokenizeMentions(message: IMessage): IMessage {
		let count = message.tokens?.length || 0;

		if (message.mentions && message.mentions.length > 0) {
			message.mentions.forEach((mention) => {
				message.msg = message.msg.replace(new RegExp(`(@${mention.username})`, 'gm'), (match) => {
					const token = `<i class=notranslate>{${count++}}</i>`;
					message.tokens?.push({
						token,
						text: match,
					});
					return token;
				});
			});
		}

		if (message.channels && message.channels.length > 0) {
			message.channels.forEach((channel) => {
				message.msg = message.msg.replace(new RegExp(`(#${channel.name})`, 'gm'), (match) => {
					const token = `<i class=notranslate>{${count++}}</i>`;
					message.tokens?.push({
						token,
						text: match,
					});
					return token;
				});
			});
		}

		return message;
	}

	deTokenize(message: IMessage): string {
		if (message.tokens && message.tokens?.length > 0) {
			for (const { token, text, noHtml } of message.tokens) {
				message.msg = message.msg.replace(token, () => noHtml || text);
			}
		}
		return message.msg;
	}

	/**
	 * Triggers the translation of the prepared (tokenized) message
	 * and persists the result
	 * @public
	 * @param {object} message
	 * @param {object} room
	 * @param {object} targetLanguage
	 * @returns {object} unmodified message object.
	 */
	async translateMessage(message: IMessage, room: IRoom, targetLanguage?: string): Promise<IMessage | null> {
		let targetLanguages: string[];
		if (targetLanguage) {
			targetLanguages = [targetLanguage];
		} else {
			targetLanguages = (await Subscriptions.getAutoTranslateLanguagesByRoomAndNotUser(room._id, message.u?._id)).filter(isTruthy);
		}
		if (message.msg) {
			setImmediate(async () => {
				let targetMessage = Object.assign({}, message);
				targetMessage.html = escapeHTML(String(targetMessage.msg));
				targetMessage = this.tokenize(targetMessage);

				const translations = await this._translateMessage(targetMessage, targetLanguages);
				if (!_.isEmpty(translations)) {
					await Messages.addTranslations(message._id, translations, TranslationProviderRegistry[Provider] || '');
				}
			});
		}

		if (message.attachments && message.attachments.length > 0) {
			setImmediate(async () => {
				for await (const [index, attachment] of message.attachments?.entries() ?? []) {
					if (attachment.description || attachment.text) {
						// Removes the initial link `[ ](quoterl)` from quote message before translation
						const translatedText = attachment?.text?.replace(/\[(.*?)\]\(.*?\)/g, '$1') || attachment?.text;
						const attachmentMessage = { ...attachment, text: translatedText };
						const translations = await this._translateAttachmentDescriptions(attachmentMessage, targetLanguages);

						if (!_.isEmpty(translations)) {
							await Messages.addAttachmentTranslations(message._id, String(index), translations);
						}
					}
				}
			});
		}
		return Messages.findOneById(message._id);
	}

	/**
	 * Returns metadata information about the service provider which is used by
	 * the generic implementation
	 * @abstract
	 * @protected
	 * @returns { name, displayName, settings }
		};
	 */
	abstract _getProviderMetadata(): IProviderMetadata;

	/**
	 * Provides the possible languages _from_ which a message can be translated into a target language
	 * @abstract
	 * @protected
	 * @param {string} target - the language into which shall be translated
	 * @returns [{ language, name }]
	 */
	abstract getSupportedLanguages(target: string): Promise<ISupportedLanguage[]>;

	/**
	 * Performs the actual translation of a message,
	 * usually by sending a REST API call to the service provider.
	 * @abstract
	 * @protected
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @return {object}
	 */
	abstract _translateMessage(message: IMessage, targetLanguages: string[]): Promise<ITranslationResult>;

	/**
	 * Performs the actual translation of an attachment (precisely its description),
	 * usually by sending a REST API call to the service provider.
	 * @abstract
	 * @param {object} attachment
	 * @param {object} targetLanguages
	 * @returns {object} translated messages for each target language
	 */
	abstract _translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): Promise<ITranslationResult>;
}

Meteor.startup(() => {
	/** Register the active service provider on the 'AfterSaveMessage' callback.
	 *  So the registered provider will be invoked when a message is saved.
	 *  All the other inactive service provider must be deactivated.
	 */
	settings.watch<string>('AutoTranslate_ServiceProvider', (providerName) => {
		TranslationProviderRegistry.setCurrentProvider(providerName);
	});

	// Get Auto Translate Active flag
	settings.watch<boolean>('AutoTranslate_Enabled', (value) => {
		TranslationProviderRegistry.setEnable(value);
	});
});
