import type { LayoutBlockish } from '../LayoutBlockish';
import type { PlainText } from '../text/PlainText';

export type VideoBlock = LayoutBlockish<{
	type: 'video';
	title: PlainText;
	titleUrl?: string;
	description?: PlainText;
	videoUrl: string;
	thumbnailUrl: string;
	altText: string;
	providerName?: string;
	providerIconUrl?: string;
	authorName?: string;
}>;
