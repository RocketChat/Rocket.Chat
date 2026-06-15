import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';

import type { IMessage } from '@rocket.chat/core-typings';

/**
 * Lightweight in-memory LRU cache for translations.
 * Helps prevent redundant translation provider API calls.
 */
export class TranslationMemoryCache {
	private static cache = new LRUCache<string, string>({ max: 10000 });

	/**
	 * Generates a cache key by hashing the normalized message text.
	 * Includes provider, sourceLanguage and targetLanguage to prevent
	 * cross-language collisions while keeping keys short.
	 */
	private static generateKey(
		provider: string,
		messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>,
		targetLanguage: string,
		sourceLanguage = 'auto',
	): string {
		let textPart = '';
		if (typeof messageOrText === 'string') {
			textPart = messageOrText;
		} else {
			const tokens = messageOrText.tokens?.slice().sort((a, b) => a.token.localeCompare(b.token));
			const mentions = messageOrText.mentions?.slice().sort((a, b) => a._id.localeCompare(b._id));
			const channels = messageOrText.channels?.slice().sort((a, b) => a.name.localeCompare(b.name));
			textPart = `${messageOrText.msg}:${JSON.stringify(tokens)}:${JSON.stringify(mentions)}:${JSON.stringify(channels)}`;
		}

		const hash = createHash('sha256').update(textPart).digest('hex').slice(0, 16);
		return `${provider}:${sourceLanguage}:${targetLanguage}:${hash}`;
	}

	static get(
		provider: string,
		messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>,
		targetLanguage: string,
		sourceLanguage = 'auto',
	): string | undefined {
		return this.cache.get(this.generateKey(provider, messageOrText, targetLanguage, sourceLanguage));
	}

	static set(
		provider: string,
		messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>,
		targetLanguage: string,
		translation: string,
		sourceLanguage = 'auto',
	): void {
		this.cache.set(this.generateKey(provider, messageOrText, targetLanguage, sourceLanguage), translation);
	}

	static clear(): void {
		this.cache.clear();
	}
}
