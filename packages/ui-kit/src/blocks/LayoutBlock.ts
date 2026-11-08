import type { ActionsBlock } from './layout/ActionsBlock.js';
import type { AlertBlock } from './layout/AlertBlock.js';
import type { CalloutBlock } from './layout/CalloutBlock.js';
import type { CardBlock } from './layout/CardBlock.js';
import type { CarouselBlock } from './layout/CarouselBlock.js';
import type { ConditionalBlock } from './layout/ConditionalBlock.js';
import type { ContextActionsBlock } from './layout/ContextActionsBlock.js';
import type { ContextBlock } from './layout/ContextBlock.js';
import type { DataTableBlock } from './layout/DataTableBlock.js';
import type { DataVisualizationBlock } from './layout/DataVisualizationBlock.js';
import type { DividerBlock } from './layout/DividerBlock.js';
import type { ExperimentalTabNavigationBlock } from './layout/ExperimentalTabNavigationBlock.js';
import type { FileBlock } from './layout/FileBlock.js';
import type { HeaderBlock } from './layout/HeaderBlock.js';
import type { ImageBlock } from './layout/ImageBlock.js';
import type { InfoCardBlock } from './layout/InfoCardBlock.js';
import type { InputBlock } from './layout/InputBlock.js';
import type { MarkdownBlock } from './layout/MarkdownBlock.js';
import type { PlanBlock } from './layout/PlanBlock.js';
import type { PreviewBlock } from './layout/PreviewBlock.js';
import type { RichTextBlock } from './layout/RichTextBlock.js';
import type { SectionBlock } from './layout/SectionBlock.js';
import type { TableBlock } from './layout/TableBlock.js';
import type { TaskCardBlock } from './layout/TaskCardBlock.js';
import type { VideoBlock } from './layout/VideoBlock.js';
import type { VideoConferenceBlock } from './layout/VideoConferenceBlock.js';

export type LayoutBlock =
	| PreviewBlock
	| RichTextBlock
	| ActionsBlock
	| ConditionalBlock
	| ContextBlock
	| DividerBlock
	| HeaderBlock
	| ImageBlock
	| InputBlock
	| MarkdownBlock
	| SectionBlock
	| ContextActionsBlock
	| VideoBlock
	| TableBlock
	| VideoConferenceBlock
	| CalloutBlock
	| ExperimentalTabNavigationBlock
	| InfoCardBlock
	| FileBlock
	| TaskCardBlock
	| PlanBlock
	| AlertBlock
	| CardBlock
	| CarouselBlock
	| DataTableBlock
	| DataVisualizationBlock;
