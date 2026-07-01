import type { ActionsBlock } from '../../blocks/layout/ActionsBlock';
import type { CalloutBlock } from '../../blocks/layout/CalloutBlock';
import type { ContextBlock } from '../../blocks/layout/ContextBlock';
import type { DividerBlock } from '../../blocks/layout/DividerBlock';
import type { HeaderBlock } from '../../blocks/layout/HeaderBlock';
import type { ImageBlock } from '../../blocks/layout/ImageBlock';
import type { InputBlock } from '../../blocks/layout/InputBlock';
import type { SectionBlock } from '../../blocks/layout/SectionBlock';
import type { VideoBlock } from '../../blocks/layout/VideoBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

type ModalSurfaceLayoutBlock =
	| ActionsBlock
	| ContextBlock
	| DividerBlock
	| HeaderBlock
	| ImageBlock
	| InputBlock
	| SectionBlock
	| VideoBlock
	| CalloutBlock;

export abstract class UiKitParserModal<OutputElement> extends SurfaceRenderer<OutputElement, ModalSurfaceLayoutBlock> {
	public constructor() {
		super(['actions', 'context', 'divider', 'header', 'image', 'input', 'section', 'video', 'callout']);
	}
}

export type ModalSurfaceLayout = ModalSurfaceLayoutBlock[];
