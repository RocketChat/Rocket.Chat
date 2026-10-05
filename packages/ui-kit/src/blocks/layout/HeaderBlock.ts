import type { LayoutBlockish } from '../LayoutBlockish';
import type { PlainText } from '../text/PlainText';

/** A large title that separates sections of a surface. */
export type HeaderBlock = LayoutBlockish<{
	type: 'header';
	text: PlainText;
}>;
