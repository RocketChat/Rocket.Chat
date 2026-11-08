import type { ActionsBlock } from './ActionsBlock';
import type { AlertBlock } from './AlertBlock';
import type { CardBlock } from './CardBlock';
import type { CarouselBlock } from './CarouselBlock';
import type { ContainerBlock } from './ContainerBlock';
import type { ContextBlock } from './ContextBlock';
import type { DataTableBlock } from './DataTableBlock';
import type { DataVisualizationBlock } from './DataVisualizationBlock';
import type { DividerBlock } from './DividerBlock';
import type { FileBlock } from './FileBlock';
import type { HeaderBlock } from './HeaderBlock';
import type { ImageBlock } from './ImageBlock';
import type { InputBlock } from './InputBlock';
import type { RichTextBlock } from './RichTextBlock';
import type { SectionBlock } from './SectionBlock';
import type { TableBlock } from './TableBlock';
import type { VideoBlock } from './VideoBlock';
import type { LayoutBlockish } from '../LayoutBlockish';

/** The block types a layout accepts in its items. */
export const layoutItemBlockTypes = [
	'actions',
	'alert',
	'card',
	'carousel',
	'container',
	'context',
	'data_table',
	'data_visualization',
	'divider',
	'file',
	'header',
	'image',
	'input',
	'rich_text',
	'section',
	'table',
	'video',
] as const;

export type LayoutItemBlock =
	| ActionsBlock
	| AlertBlock
	| CardBlock
	| CarouselBlock
	| ContainerBlock
	| ContextBlock
	| DataTableBlock
	| DataVisualizationBlock
	| DividerBlock
	| FileBlock
	| HeaderBlock
	| ImageBlock
	| InputBlock
	| RichTextBlock
	| SectionBlock
	| TableBlock
	| VideoBlock;

/** The blocks an app supplies for clients that cannot draw a layout. */
export type LayoutFallbackBlock =
	ContextBlock | DividerBlock | HeaderBlock | ImageBlock | RichTextBlock | SectionBlock | TableBlock | VideoBlock;

/** One block in a row; `width` weighs its share of the row as narrow 1, standard 2 and wide 3. */
export type LayoutItem = {
	block: LayoutItemBlock;
	/** Defaults to `standard`. */
	width?: 'narrow' | 'standard' | 'wide';
	/** Omit to let the content fill the cell. `start` and `end` follow the text direction. */
	horizontal_alignment?: 'start' | 'center' | 'end';
};

/** From 1 to 3 items side by side; they wrap when the row is too narrow. */
export type LayoutRow = {
	items: readonly LayoutItem[];
};

/** Arranges blocks in 1 to 5 rows of up to 3 items. It is purely visual and adds no grid semantics. */
export type LayoutGridBlock = LayoutBlockish<{
	type: 'layout';
	/** At most 150 characters. Only drawn when `is_label_visible` is true. */
	label: string;
	/** Draws the label as bold text above the rows. Defaults to false. */
	is_label_visible?: boolean;
	/** From 1 to 5 rows. */
	rows: readonly LayoutRow[];
	/** Defaults to `none`; `rows` adds an outer border and lines between rows, `outer` the border only. */
	grid_lines?: 'none' | 'rows' | 'outer';
	/** Drawn by clients that do not support layout blocks, in place of the layout. */
	fallback?: readonly LayoutFallbackBlock[];
}>;
