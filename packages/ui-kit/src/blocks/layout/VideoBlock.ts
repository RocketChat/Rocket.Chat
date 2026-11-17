import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { PlainText } from '../text/PlainText.js';

/** A video shown as its thumbnail, which plays in place once clicked. */
export type VideoBlock = LayoutBlockish<{
	type: 'video';
	/** An embeddable page that plays the video, loaded in a frame; only absolute `https` URLs from another origin than the workspace play. */
	video_url: string;
	thumbnail_url: string;
	/** Describes the video for screen readers and when the thumbnail does not load. */
	alt_text: string;
	title: PlainText;
	/** Opened when the title is clicked. */
	title_url?: string;
	description?: PlainText;
	author_name?: string;
	provider_name?: string;
	provider_icon_url?: string;
}>;
