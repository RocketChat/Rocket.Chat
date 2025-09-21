/**
 * TranslationMemory
 * Stores previously translated messages to reduce repeated API calls.
 * Optimized for performance and secure memory storage.
 */

type TranslationCache = Map<string, string>; // Maps original message -> translated message

export class TranslationMemory {
	private cache: Map<string, TranslationCache> = new Map();

	// Store a translation in memory
	storeTranslation(originalMessage: string, targetLang: string, translatedMessage: string): void {
		if (!originalMessage || !targetLang || !translatedMessage) return;

		if (!this.cache.has(targetLang)) {
			this.cache.set(targetLang, new Map());
		}

		const langCache = this.cache.get(targetLang)!;
		langCache.set(originalMessage, translatedMessage);
	}

	// Retrieve a previously stored translation
	getTranslation(originalMessage: string, targetLang: string): string | null {
		const langCache = this.cache.get(targetLang);
		if (!langCache) return null;

		return langCache.get(originalMessage) || null;
	}

	// Clear cache for a specific language
	clearLanguageCache(targetLang: string): void {
		if (this.cache.has(targetLang)) {
			this.cache.delete(targetLang);
		}
	}

	// Clear all translations
	clearAll(): void {
		this.cache.clear();
	}
}

// Single instance
export const translationMemory = new TranslationMemory();