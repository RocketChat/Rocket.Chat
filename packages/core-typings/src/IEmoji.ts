/**
 * Custom emoji data broadcast to clients through the `updateEmojiCustom` and
 * `deleteEmojiCustom` notifications when a custom emoji changes.
 */
export interface IEmoji {
	name: string;
	extension: string;
	aliases?: string[];
	etag?: string;
	previousName?: string;
	previousExtension?: string;
}
