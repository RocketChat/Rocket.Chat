import type { IMessage } from '@rocket.chat/core-typings';

export class TranslationMemoryCache {
	private static map = new Map<string, string>();
	private static MAX_CACHE_SIZE = 10000;

	private static generateKey(provider: string, messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>, targetLanguage: string): string {
			let textPart = '';
			if (typeof messageOrText === 'string') {
						textPart = messageOrText;
			} else {
						textPart = `${messageOrText.msg}:${JSON.stringify(messageOrText.tokens)}:${JSON.stringify(messageOrText.mentions)}:${JSON.stringify(messageOrText.channels)}`;
			}
			return `${provider}:${targetLanguage}:${textPart}`;
	}
	static get(provider: string, messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>, targetLanguage: string): string | undefined {
			const key = this.generateKey(provider, messageOrText, targetLanguage);
			const cached = this.map.get(key);
			if (cached) {
						this.map.delete(key);
						this.map.set(key, cached);
			}
			return cached;
	}

	static set(provider: string, messageOrText: string | Pick<IMessage, 'msg' | 'tokens' | 'mentions' | 'channels'>, targetLanguage: string, translatedText: string): void {
			const key = this.generateKey(provider, messageOrText, targetLanguage);
			this.map.set(key, translatedText);
			if (this.map.size > this.MAX_CACHE_SIZE) {
						const firstKey = this.map.keys().next().value;
						if (firstKey !== undefined) {
										this.map.delete(firstKey);
						}
			}
	}
}
}
