import type { ActionsBlock } from './layout/ActionsBlock.js';
import type { CalloutBlock } from './layout/CalloutBlock.js';
import type { ConditionalBlock } from './layout/ConditionalBlock.js';
import type { ContextActionsBlock } from './layout/ContextActionsBlock.js';
import type { ContextBlock } from './layout/ContextBlock.js';
import type { DividerBlock } from './layout/DividerBlock.js';
import type { ExperimentalTabNavigationBlock } from './layout/ExperimentalTabNavigationBlock.js';
import type { HeaderBlock } from './layout/HeaderBlock.js';
import type { ImageBlock } from './layout/ImageBlock.js';
import type { InfoCardBlock } from './layout/InfoCardBlock.js';
import type { InputBlock } from './layout/InputBlock.js';
import type { MarkdownBlock } from './layout/MarkdownBlock.js';
import type { PreviewBlock } from './layout/PreviewBlock.js';
import type { SectionBlock } from './layout/SectionBlock.js';
import type { TableBlock } from './layout/TableBlock.js';
import type { VideoBlock } from './layout/VideoBlock.js';
import type { VideoConferenceBlock } from './layout/VideoConferenceBlock.js';

export type LayoutBlock =
	| PreviewBlock
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
	| InfoCardBlock;
