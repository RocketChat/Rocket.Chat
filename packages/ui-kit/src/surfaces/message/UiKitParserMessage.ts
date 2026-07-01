import type { ActionsBlock } from '../../blocks/layout/ActionsBlock';
import type { CalloutBlock } from '../../blocks/layout/CalloutBlock';
import type { ContextBlock } from '../../blocks/layout/ContextBlock';
import type { DividerBlock } from '../../blocks/layout/DividerBlock';
import type { HeaderBlock } from '../../blocks/layout/HeaderBlock';
import type { ImageBlock } from '../../blocks/layout/ImageBlock';
import type { InfoCardBlock } from '../../blocks/layout/InfoCardBlock';
import type { PreviewBlock } from '../../blocks/layout/PreviewBlock';
import type { SectionBlock } from '../../blocks/layout/SectionBlock';
import type { VideoBlock } from '../../blocks/layout/VideoBlock';
import type { VideoConferenceBlock } from '../../blocks/layout/VideoConferenceBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

type MessageSurfaceLayoutBlock =
	| ActionsBlock
	| ContextBlock
	| DividerBlock
	| HeaderBlock
	| ImageBlock
	| SectionBlock
	| VideoBlock
	| VideoConferenceBlock
	| PreviewBlock
	| CalloutBlock
	| InfoCardBlock;

export abstract class UiKitParserMessage<OutputElement> extends SurfaceRenderer<OutputElement, MessageSurfaceLayoutBlock> {
	public constructor() {
		super(['actions', 'context', 'divider', 'header', 'image', 'section', 'preview', 'video', 'video_conf', 'callout']);
	}
}

export type MessageSurfaceLayout = MessageSurfaceLayoutBlock[];
