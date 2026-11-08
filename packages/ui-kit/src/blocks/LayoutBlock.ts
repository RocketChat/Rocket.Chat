import type { ActionsBlock } from './layout/ActionsBlock';
import type { AlertBlock } from './layout/AlertBlock';
import type { CalloutBlock } from './layout/CalloutBlock';
import type { CardBlock } from './layout/CardBlock';
import type { CarouselBlock } from './layout/CarouselBlock';
import type { ConditionalBlock } from './layout/ConditionalBlock';
import type { ContainerBlock } from './layout/ContainerBlock';
import type { ContextActionsBlock } from './layout/ContextActionsBlock';
import type { ContextBlock } from './layout/ContextBlock';
import type { DataTableBlock } from './layout/DataTableBlock';
import type { DataVisualizationBlock } from './layout/DataVisualizationBlock';
import type { DividerBlock } from './layout/DividerBlock';
import type { ExperimentalTabNavigationBlock } from './layout/ExperimentalTabNavigationBlock';
import type { FileBlock } from './layout/FileBlock';
import type { HeaderBlock } from './layout/HeaderBlock';
import type { ImageBlock } from './layout/ImageBlock';
import type { InfoCardBlock } from './layout/InfoCardBlock';
import type { InputBlock } from './layout/InputBlock';
import type { LayoutGridBlock } from './layout/LayoutGridBlock';
import type { MarkdownBlock } from './layout/MarkdownBlock';
import type { PlanBlock } from './layout/PlanBlock';
import type { PreviewBlock } from './layout/PreviewBlock';
import type { RichTextBlock } from './layout/RichTextBlock';
import type { SectionBlock } from './layout/SectionBlock';
import type { TableBlock } from './layout/TableBlock';
import type { TaskCardBlock } from './layout/TaskCardBlock';
import type { VideoBlock } from './layout/VideoBlock';
import type { VideoConferenceBlock } from './layout/VideoConferenceBlock';

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
	| DataVisualizationBlock
	| ContainerBlock
	| LayoutGridBlock;
