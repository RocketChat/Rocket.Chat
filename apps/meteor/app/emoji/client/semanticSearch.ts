import { emoji } from './lib';
import semanticEmojiData from '../lib/semantic-emoji-search-data.json';

interface SemanticEmojiEntry {
	k: string; // keyword
	e: string[]; // emoji unicode values
}

// Convert unicode hex string to the format expected by emojione
const normalizeUnicode = (unicodeHex: string): string => {
	// Convert from format like "1F44D" to "1f44d"
	return unicodeHex.toLowerCase();
};

// Create a mapping from unicode to shortcodes when needed
let unicodeToShortcodeCache: Map<string, string> | null = null;

const buildUnicodeToShortcodeMapping = (): Map<string, string> => {
	if (unicodeToShortcodeCache) {
		return unicodeToShortcodeCache;
	}
	
	const mapping = new Map<string, string>();
	
	for (const shortcode in emoji.list) {
		if (emoji.list.hasOwnProperty(shortcode)) {
			const emojiObj = emoji.list[shortcode];
			if (emojiObj && 'uc_base' in emojiObj) {
				// Map various unicode formats to the shortcode
				mapping.set(emojiObj.uc_base, shortcode);
				if (emojiObj.uc_output) {
					mapping.set(emojiObj.uc_output, shortcode);
				}
				if (emojiObj.uc_match) {
					mapping.set(emojiObj.uc_match, shortcode);
				}
				if (emojiObj.uc_greedy) {
					mapping.set(emojiObj.uc_greedy, shortcode);
				}
			}
		}
	}
	
	unicodeToShortcodeCache = mapping;
	return mapping;
};

// Find emoji shortcode from unicode using the pre-built mapping
const findEmojiShortcodeFromUnicode = (unicodeHex: string): string | null => {
	try {
		const normalizedHex = normalizeUnicode(unicodeHex);
		const mapping = buildUnicodeToShortcodeMapping();
		
		// Try exact match first
		if (mapping.has(normalizedHex)) {
			return mapping.get(normalizedHex)!;
		}
		
		// Try with -fe0f suffix (common variant)
		const withSuffix = `${normalizedHex}-fe0f`;
		if (mapping.has(withSuffix)) {
			return mapping.get(withSuffix)!;
		}
		
		// Try removing -fe0f suffix if it exists
		const withoutSuffix = normalizedHex.replace(/-fe0f$/, '');
		if (withoutSuffix !== normalizedHex && mapping.has(withoutSuffix)) {
			return mapping.get(withoutSuffix)!;
		}
		
		return null;
	} catch (error) {
		console.warn('Error converting unicode to shortcode:', error);
		return null;
	}
};

// Search for emojis by semantic keyword
export const getEmojisBySemanticSearch = (
	searchTerm: string,
	actualTone: number,
	_recentEmojis: string[],
	_setRecentEmojis: (emojis: string[]) => void,
): { emoji: string; image: string | undefined }[] => {
	const results: { emoji: string; image: string | undefined }[] = [];
	const searchTermLower = searchTerm.toLowerCase().trim();
	
	if (!searchTermLower || searchTermLower.length < 2) {
		return results;
	}
	
	// Find matching semantic entries
	const matchingEntries = (semanticEmojiData as SemanticEmojiEntry[]).filter((entry) => 
		entry.k.toLowerCase().includes(searchTermLower)
	);
	
	// Use a Set to track processed emojis and avoid duplicates
	const processedEmojis = new Set<string>();
	
	// Convert unicode values to emoji items
	for (const entry of matchingEntries) {
		// Remove duplicates from the unicode array first
		const uniqueUnicodes = [...new Set(entry.e)];
		
		for (const unicodeHex of uniqueUnicodes) {
			const shortcode = findEmojiShortcodeFromUnicode(unicodeHex);
			
			if (shortcode && emoji.list[shortcode]) {
				const emojiObject = emoji.list[shortcode];
				const { emojiPackage } = emojiObject;
				
				// Apply tone if applicable
				let current = shortcode.replace(/:/g, '');
				let tone = '';
				
				if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(current)) {
					tone = `_tone${actualTone}`;
				}
				
				const emojiToRender = `:${current}${tone}:`;
				const finalEmojiKey = `${current}${tone}`;
				
				// Check if we've already processed this emoji (with or without tone)
				if (!processedEmojis.has(finalEmojiKey)) {
					// Check if emoji exists with tone
					if (emoji.list[emojiToRender]) {
						const image = emoji.packages[emojiPackage].renderPicker(emojiToRender);
						if (image) {
							results.push({ emoji: current, image });
							processedEmojis.add(finalEmojiKey);
						}
					}
				}
			}
		}
	}
	
	return results;
};

// Combined search that includes both regular and semantic results
export const getCombinedEmojiSearch = (
	searchTerm: string,
	actualTone: number,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
	getEmojisBySearchTerm: (searchTerm: string, actualTone: number, recentEmojis: string[], setRecentEmojis: (emojis: string[]) => void) => { emoji: string; image: string | undefined }[],
): { emoji: string; image: string | undefined }[] => {
	// Get regular search results
	const regularResults = getEmojisBySearchTerm(searchTerm, actualTone, recentEmojis, setRecentEmojis);
	
	// Get semantic search results
	const semanticResults = getEmojisBySemanticSearch(searchTerm, actualTone, recentEmojis, setRecentEmojis);
	
	// Combine both results and remove duplicates based on the rendered image
	const combinedResults: { emoji: string; image: string | undefined }[] = [];
	const processedImages = new Set<string>();
	
	// Add regular results first (they have priority)
	for (const result of regularResults) {
		// Use image as the deduplication key since different shortcodes can render the same emoji
		const dedupeKey = result.image || result.emoji;
		if (!processedImages.has(dedupeKey)) {
			combinedResults.push(result);
			processedImages.add(dedupeKey);
		}
	}
	
	// Add semantic results that aren't already included
	for (const result of semanticResults) {
		const dedupeKey = result.image || result.emoji;
		if (!processedImages.has(dedupeKey)) {
			combinedResults.push(result);
			processedImages.add(dedupeKey);
		}
	}
	
	return combinedResults;
};