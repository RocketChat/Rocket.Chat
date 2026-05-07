import { createHash } from 'crypto';

import type { IMessage } from '@rocket.chat/core-typings';

/**
 * Lightweight in-memory LRU cache for translations.
 * Helps prevent redundant translation provider API calls.
 */
export class TranslationMemoryCache {
	private static map = new Map<string, string>();

	private static MAX_CACHE_SIZE = 10000;

	/**
	 * In-flight promise map to coalesce concurrent identical translation
	 * requests.  While a provider call is still pending, any duplicate
	 * request for the same key will await the existing promise instead of
	 * issuing a second API call.
	 */
	private static pending = new Map<string, Promise<string>>();

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
			textPart = `${messageOrText.msg}:${JSON.stringify(messageOrText.tokens)}:${JSON.stringify(messageOrText.mentions)}:${JSON.stringify(messageOrText.channels)}`;
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
		const key = this.generateKey(provider, messageOrText, targetLanguage, sourceLanguage);
		const cached = this.map.get(key);
		if (cached) {
			// Refresh LRU by re-inserting
			this.map.delete(key);
			this.map.set(key, cached);
		}
		return cached;
	}

	static set(
		provider: string,
		messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>,
		targetLanguage: string,
		translation: string,
		sourceLanguage = 'auto',
	): void {
		const key = this.generateKey(provider, messageOrText, targetLanguage, sourceLanguage);
		if (this.map.has(key)) {
			this.map.delete(key);
		} else if (this.map.size >= this.MAX_CACHE_SIZE) {
			// Evict the oldest entry (first item in Map)
			const firstKey = this.map.keys().next().value;
			if (firstKey) {
				this.map.delete(firstKey);
			}
		}
		this.map.set(key, translation);
	}

	/**
	 * Wraps an async provider call so that concurrent identical requests
	 * share a single in-flight promise rather than issuing parallel API
	 * calls.  Once the promise settles it is removed from the pending map.
	 */
	static async singleFlight(
		provider: string,
		messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>,
		targetLanguage: string,
		fetcher: () => Promise<string>,
		sourceLanguage = 'auto',
	): Promise<string> {
		const key = this.generateKey(provider, messageOrText, targetLanguage, sourceLanguage);

		const inflight = this.pending.get(key);
		if (inflight) {
			return inflight;
		}

		const promise = fetcher().then(
			(result) => {
				this.pending.delete(key);
				this.set(provider, messageOrText, targetLanguage, result, sourceLanguage);
				return result;
			},
			(error) => {
				this.pending.delete(key);
				throw error;
			},
		);

		this.pending.set(key, promise);
		return promise;
	}

	static clear(): void {
		this.map.clear();
		this.pending.clear();
	}
}
