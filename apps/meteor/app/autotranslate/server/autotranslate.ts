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
import { notifyOnMessageChange } from '../../lib/server/lib/notifyListener';
import { Markdown } from '../../markdown/server';
import { settings } from '../../settings/server';
import { translationMemory } from './TranslationMemory';

const translationLogger = new Logger('AutoTranslate');

const Providers = Symbol('Providers');
const Provider = Symbol('Provider');

export class TranslationProviderRegistry {
	static [Providers]: { [k: string]: AutoTranslate } = {};
	static enabled = false;
	static [Provider]: string | null = null;

	static registerProvider(provider: AutoTranslate): void {
		const metadata = provider._getProviderMetadata();
		if (!metadata) {
			translationLogger.error('Provider metadata is not defined');
			return;
		}
		TranslationProviderRegistry[Providers][metadata.name] = provider;
	}

	static getActiveProvider(): AutoTranslate | null {
		if (!TranslationProviderRegistry.enabled || !TranslationProviderRegistry[Provider]) {
			return null;
		}
		return TranslationProviderRegistry[Providers][TranslationProviderRegistry[Provider]];
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
		return provider.translateMessage(message, { room, targetLanguage });
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
		callbacks.add(
			'afterSaveMessage',
			(message, { room }) => provider.translateMessage(message, { room }),
			callbacks.priority.MEDIUM,
			'autotranslate',
		);
	}
}

export abstract class AutoTranslate {
	name: string;
	languages: string[];
	supportedLanguages: ISupportedLanguages;

	constructor() {
		this.name = '';
		this.languages = [];
		this.supportedLanguages = {};
	}

	tokenize(message: IMessage): IMessage {
		if (!message) {
			return message;
		}
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
		if (!message.msg) {
			return message;
		}
		let count = message.tokens?.length || 0;
		message.msg = message.msg.replace(/:[+\w\d]+:/g, (match) => {
			const token = `<i class=notranslate>{${count++}}</i>`;
			message.tokens?.push({ token, text: match });
			return token;
		});
		return message;
	}

	tokenizeURLs(message: IMessage): IMessage {
		if (!message.msg) {
			return message;
		}
		let count = message.tokens?.length || 0;
		const schemes = 'http,https';
		message.msg = message.msg.replace(
			new RegExp(`(!?\\[)([^\\]]+)(\\]\\((?:${schemes}):\\/\\/[^\\)]+\\))`, 'gm'),
			(_match, pre, text, post) => {
				const pretoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({ token: pretoken, text: pre });
				const posttoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({ token: posttoken, text: post });
				return pretoken + text + posttoken;
			},
		);
		message.msg = message.msg.replace(
			new RegExp(`((?:<|&lt;)(?:${schemes}):\\/\\/[^\\|]+\\|)(.+?)(?=>|&gt;)((?:>|&gt;))`, 'gm'),
			(_match, pre, text, post) => {
				const pretoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({ token: pretoken, text: pre });
				const posttoken = `<i class=notranslate>{${count++}}</i>`;
				message.tokens?.push({ token: posttoken, text: post });
				return pretoken + text + posttoken;
			},
		);
		return message;
	}

	tokenizeCode(message: IMessage): IMessage {
		if (!message.msg) {
			return message;
		}
		let count = message.tokens?.length || 0;
		message.html = escapeHTML(String(message.msg));
		message = Markdown.parseMessageNotEscaped(message);
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
		if (!message.msg) {
			return message;
		}
		let count = message.tokens?.length || 0;
		if (message.mentions && message.mentions.length > 0) {
			message.mentions.forEach((mention) => {
				if (mention.username) {
					message.msg = message.msg.replace(new RegExp(`@${mention.username}\\b`, 'gm'), (match) => {
						const token = `<i class=notranslate>{${count++}}</i>`;
						message.tokens?.push({ token, text: match });
						return token;
					});
				}
			});
		}
		if (message.channels && message.channels.length > 0) {
			message.channels.forEach((channel) => {
				if (channel.name) {
					message.msg = message.msg.replace(new RegExp(`#${channel.name}\\b`, 'gm'), (match) => {
						const token = `<i class=notranslate>{${count++}}</i>`;
						message.tokens?.push({ token, text: match });
						return token;
					});
				}
			});
		}
		return message;
	}

	deTokenize(message: IMessage): string {
		if (!message.msg) {
			return '';
		}
		if (message.tokens && message.tokens.length > 0) {
			for (const { token, text, noHtml } of message.tokens) {
				message.msg = message.msg.replace(token, () => noHtml || text);
			}
		}
		return message.msg;
	}

	async translateMessage(message: IMessage, { room, targetLanguage }: { room: IRoom; targetLanguage?: string }): Promise<IMessage | null> {
		if (!message || !message.msg || !room) {
			return null;
		}

		const targetLanguages = targetLanguage
			? [targetLanguage]
			: (await Subscriptions.getAutoTranslateLanguagesByRoomAndNotUser(room._id, message.u?._id)).filter(isTruthy);

		if (!targetLanguages.length) {
			return null;
		}

		try {
			// Process message translations
			const translations: ITranslationResult = {};
			let targetMessage = { ...message, tokens: message.tokens || [] };
			targetMessage.html = escapeHTML(String(targetMessage.msg));
			targetMessage = this.tokenize(targetMessage);

			for (const lang of targetLanguages) {
				const cacheKey = targetMessage.msg.trim();
				const cached = translationMemory.getTranslation(cacheKey, lang);
				if (cached) {
					translations[lang] = cached;
					continue;
				}
				const translated = await this._translateMessage(targetMessage, [lang]);
				if (translated[lang]) {
					translations[lang] = translated[lang];
					translationMemory.storeTranslation(cacheKey, lang, translated[lang]);
				}
			}

			if (!_.isEmpty(translations)) {
				await Messages.addTranslations(message._id, translations, TranslationProviderRegistry[Provider] || '');
				this.notifyTranslatedMessage(message._id);
			}

			// Process attachment translations
			if (message.attachments && message.attachments.length > 0) {
				for (const [index, attachment] of message.attachments.entries()) {
					if (attachment.description || attachment.text) {
						const translatedText = attachment.text?.replace(/\[(.*?)\]\(.*?\)/g, '$1') || attachment.description || '';
						const attachmentMessage = { ...attachment, text: translatedText };
						const attachmentTranslations: ITranslationResult = {};

						for (const lang of targetLanguages) {
							const cacheKey = translatedText.trim();
							const cached = translationMemory.getTranslation(cacheKey, lang);
							if (cached) {
								attachmentTranslations[lang] = cached;
								continue;
							}
							const translated = await this._translateAttachmentDescriptions(attachmentMessage, [lang]);
							if (translated[lang]) {
								attachmentTranslations[lang] = translated[lang];
								translationMemory.storeTranslation(cacheKey, lang, translated[lang]);
							}
						}

						if (!_.isEmpty(attachmentTranslations)) {
							await Messages.addAttachmentTranslations(message._id, String(index), attachmentTranslations);
							this.notifyTranslatedMessage(message._id);
						}
					}
				}
			}

			return await Messages.findOneById(message._id);
		} catch (error) {
			translationLogger.error(`Translation failed for message ${message._id}: ${error}`);
			return null;
		}
	}

	private notifyTranslatedMessage(messageId: string): void {
		void notifyOnMessageChange({ id: messageId });
	}

	abstract _getProviderMetadata(): IProviderMetadata;
	abstract getSupportedLanguages(target: string): Promise<ISupportedLanguage[]>;
	abstract _translateMessage(message: IMessage, targetLanguages: string[]): Promise<ITranslationResult>;
	abstract _translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): Promise<ITranslationResult>;
}

Meteor.startup(() => {
	settings.watch<string>('AutoTranslate_ServiceProvider', (providerName) => {
		TranslationProviderRegistry.setCurrentProvider(providerName);
	});
	settings.watch<boolean>('AutoTranslate_Enabled', (value) => {
		TranslationProviderRegistry.setEnable(value);
	});
});