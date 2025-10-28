import type { ActionsBlock } from '../../blocks/layout/ActionsBlock';
import type { CalloutBlock } from '../../blocks/layout/CalloutBlock';
import type { ContextBlock } from '../../blocks/layout/ContextBlock';
import type { DividerBlock } from '../../blocks/layout/DividerBlock';
import type { ImageBlock } from '../../blocks/layout/ImageBlock';
import type { PreviewBlock } from '../../blocks/layout/PreviewBlock';
import type { SectionBlock } from '../../blocks/layout/SectionBlock';
import type { VideoConferenceBlock } from '../../blocks/layout/VideoConferenceBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

type MessageSurfaceLayoutBlock =
	| ActionsBlock
	| ContextBlock
	| DividerBlock
	| ImageBlock
	| SectionBlock
	| VideoConferenceBlock
	| PreviewBlock
	| CalloutBlock;

export abstract class UiKitParserMessage<OutputElement> extends SurfaceRenderer<OutputElement, MessageSurfaceLayoutBlock> {
	public constructor() {
		super(['actions', 'context', 'divider', 'image', 'section', 'preview', 'video_conf', 'callout']);
	}
}

export type MessageSurfaceLayout = MessageSurfaceLayoutBlock[];
