import type { ActionsBlock } from '../../blocks/layout/ActionsBlock';
import type { ContextBlock } from '../../blocks/layout/ContextBlock';
import type { DividerBlock } from '../../blocks/layout/DividerBlock';
import type { ImageBlock } from '../../blocks/layout/ImageBlock';
import type { PreviewBlock } from '../../blocks/layout/PreviewBlock';
import type { SectionBlock } from '../../blocks/layout/SectionBlock';
import type { VideoConferenceBlock } from '../../blocks/layout/VideoConferenceBlock';
import { SurfaceRenderer } from '../SurfaceRenderer';

type MessageSurfaceLayoutBlock =
	| ActionsBlock
	| ContextBlock
	| DividerBlock
	| ImageBlock
	| SectionBlock
	| VideoConferenceBlock
	| PreviewBlock;

export abstract class UiKitParserMessage<OutputElement> extends SurfaceRenderer<OutputElement, MessageSurfaceLayoutBlock> {
	public constructor() {
		super(['actions', 'context', 'divider', 'image', 'section', 'preview', 'video_conf']);
	}
}

export type MessageSurfaceLayout = MessageSurfaceLayoutBlock[];
