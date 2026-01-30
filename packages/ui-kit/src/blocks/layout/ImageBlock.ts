import type { LayoutBlockish } from '../LayoutBlockish';
import type { PlainText } from '../text/PlainText';

export type ImageBlock = LayoutBlockish<{
	type: 'image';
	imageUrl: string;
	altText: string;
	title?: PlainText;
}>;
