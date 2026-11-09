import type { LayoutBlockish } from '../LayoutBlockish';

/** A longer piece of formatted text, written in Markdown, rendered like a chat message. */
export type MarkdownBlock = LayoutBlockish<{
	type: 'markdown';
	text: string;
}>;
