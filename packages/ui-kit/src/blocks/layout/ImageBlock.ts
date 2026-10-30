import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { PlainText } from '../text/PlainText.js';

export type ImageBlock = LayoutBlockish<{
	type: 'image';
	imageUrl: string;
	altText: string;
	title?: PlainText;
}>;
