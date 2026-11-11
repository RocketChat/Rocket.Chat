import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { PlainText } from '../text/PlainText.js';

/** A large title that separates sections of a surface. */
export type HeaderBlock = LayoutBlockish<{
	type: 'header';
	text: PlainText;
}>;
