import type { ActionsBlock } from './ActionsBlock.js';
import type { CardImage } from './CardBlock.js';
import type { ContextBlock } from './ContextBlock.js';
import type { DividerBlock } from './DividerBlock.js';
import type { FileBlock } from './FileBlock.js';
import type { HeaderBlock } from './HeaderBlock.js';
import type { ImageBlock } from './ImageBlock.js';
import type { InputBlock } from './InputBlock.js';
import type { LayoutGridBlock } from './LayoutGridBlock.js';
import type { RichTextBlock } from './RichTextBlock.js';
import type { SectionBlock } from './SectionBlock.js';
import type { TableBlock } from './TableBlock.js';
import type { VideoBlock } from './VideoBlock.js';
import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TextObject } from '../TextObject.js';
import type { PlainText } from '../text/PlainText.js';

/** The block types a container accepts as children. */
export const containerChildBlockTypes = [
	'actions',
	'context',
	'divider',
	'file',
	'header',
	'image',
	'input',
	'layout',
	'rich_text',
	'section',
	'table',
	'video',
] as const;

export type ContainerChildBlock =
	| ActionsBlock
	| ContextBlock
	| DividerBlock
	| FileBlock
	| HeaderBlock
	| ImageBlock
	| InputBlock
	| LayoutGridBlock
	| RichTextBlock
	| SectionBlock
	| TableBlock
	| VideoBlock;

/** A titled frame around up to 10 blocks, optionally collapsible. One of `title` and `rich_text_title` is required. */
export type ContainerBlock = LayoutBlockish<{
	type: 'container';
	/** At most 150 characters. */
	title?: PlainText;
	/** Wins over `title` when both are given. */
	rich_text_title?: RichTextBlock;
	/** At most 150 characters. */
	subtitle?: TextObject;
	/** From 1 to 10 blocks. */
	child_blocks: readonly ContainerChildBlock[];
	/** Defaults to `standard`; `full` fills the available space. */
	width?: 'narrow' | 'standard' | 'wide' | 'full';
	/** A small image beside the title and subtitle. */
	icon?: CardImage;
	/** Lets the reader hide everything but the header. Defaults to false. */
	is_collapsible?: boolean;
	/** Starts collapsed; only applies when `is_collapsible` is true. */
	default_collapsed?: boolean;
	/** Draws a line under the header; only applies when `is_collapsible` is not true. */
	has_header_divider?: boolean;
}>;
