import type { LayoutBlockish } from '../LayoutBlockish';

export type MarkdownBlock = LayoutBlockish<{
	type: 'markdown';
	text: string;
}>;
