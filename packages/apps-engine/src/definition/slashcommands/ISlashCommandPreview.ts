/**
 * What a slash command offers the user before they run it.
 *
 * An `ISlashCommand` builds one from what the user has typed so far; picking
 * an item runs the command's `executePreviewItem`.
 */
export interface ISlashCommandPreview {
	/** The i18n string of the title of the preview. */
	i18nTitle: string;
	/** The preview items to show, it can be an empty array. */
	items: Array<ISlashCommandPreviewItem>;
}

/** One choice in an {@link ISlashCommandPreview}. */
export interface ISlashCommandPreviewItem {
	/** An internal id value of the preview item. */
	id: string;
	/** The type of preview item this is. */
	type: SlashCommandPreviewItemType;
	/** The value of this preview item, url or text (could even be base64). */
	value: string;
}

/** How a preview item is rendered, and with it what its `value` holds. */
export enum SlashCommandPreviewItemType {
	/** Represents image preview. Could be `png`, `gif`, etc. */
	IMAGE = 'image',
	/** Represents video preview. */
	VIDEO = 'video',
	/** Represents audio preview. */
	AUDIO = 'audio',
	/** Represents text preview. */
	TEXT = 'text',
	/** As the name says, an unknown type (try not to use). */
	OTHER = 'other',
}
