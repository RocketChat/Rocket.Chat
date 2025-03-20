import type { ActionsBlock } from './layout/ActionsBlock';
import type { CalloutBlock } from './layout/CalloutBlock';
import type { ConditionalBlock } from './layout/ConditionalBlock';
import type { ContextBlock } from './layout/ContextBlock';
import type { DividerBlock } from './layout/DividerBlock';
import type { ExperimentalTabNavigationBlock } from './layout/ExperimentalTabNavigationBlock';
import type { ImageBlock } from './layout/ImageBlock';
import type { InputBlock } from './layout/InputBlock';
import type { PreviewBlock } from './layout/PreviewBlock';
import type { SectionBlock } from './layout/SectionBlock';
import type { VideoConferenceBlock } from './layout/VideoConferenceBlock';

export type LayoutBlock =
	| PreviewBlock
	| ActionsBlock
	| ConditionalBlock
	| ContextBlock
	| DividerBlock
	| ImageBlock
	| InputBlock
	| SectionBlock
	| VideoConferenceBlock
	| CalloutBlock
	| ExperimentalTabNavigationBlock;
