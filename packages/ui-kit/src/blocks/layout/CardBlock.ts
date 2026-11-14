import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TextObject } from '../TextObject.js';
import type { ButtonElement } from '../elements/ButtonElement.js';

/** An image given by its URL; the URL has at most 3000 characters and `alt_text` at most 2000. */
export type CardImage = {
	type: 'image';
	image_url: string;
	alt_text: string;
};

/** A self-contained card with an optional image, heading, text and up to 3 buttons. */
export type CardBlock = LayoutBlockish<{
	type: 'card';
	/** A wide image across the top of the card. */
	hero_image?: CardImage;
	/** A small image beside the title and subtitle. */
	icon?: CardImage;
	/** At most 150 characters. */
	title?: TextObject;
	/** At most 150 characters. */
	subtitle?: TextObject;
	/** At most 200 characters. */
	body?: TextObject;
	/** Small text under the body; at most 200 characters. */
	subtext?: TextObject;
	/** At most 3 buttons. */
	actions?: readonly ButtonElement[];
}>;
