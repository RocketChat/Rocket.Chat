/**
 * SafeEmoji type for runtime-validated emoji with guaranteed non-null core properties
 * Ensures emoji data is safe to use without defensive checks
 */
export interface SafeEmoji {
	/**
	 * The emoji name - guaranteed to exist and be a non-empty string
	 */
	name: string;
	/**
	 * The emoji URL - guaranteed to exist and be a valid URL string
	 */
	url: string;
	/**
	 * Optional type of emoji
	 */
	type?: string;
	/**
	 * Optional aliases for the emoji
	 */
	aliases?: string[];
	/**
	 * Optional extension (e.g., 'webp', 'png')
	 */
	extension?: string;
	/**
	 * Optional etag for caching
	 */
	etag?: string;
}

/**
 * Type guard to validate if an emoji object is a SafeEmoji
 */
export const isSafeEmoji = (emoji: any): emoji is SafeEmoji => {
	return (
		typeof emoji === 'object' &&
		emoji !== null &&
		typeof emoji.name === 'string' &&
		emoji.name.length > 0 &&
		typeof emoji.url === 'string' &&
		emoji.url.length > 0
	);
};

/**
 * Get safe name from potentially unsafe emoji object
 * @param emoji The emoji object (may be undefined/null or have missing properties)
 * @returns Safe emoji name string or fallback value
 */
export const getSafeEmojiName = (emoji: any): string => {
	return emoji?.name && typeof emoji.name === 'string' ? emoji.name : '[invalid-emoji]';
};

/**
 * Get safe URL from potentially unsafe emoji object
 * @param emoji The emoji object (may be undefined/null or have missing properties)
 * @returns Safe URL string or fallback value
 */
export const getSafeEmojiUrl = (emoji: any): string | undefined => {
	return emoji?.url && typeof emoji.url === 'string' ? emoji.url : undefined;
};
