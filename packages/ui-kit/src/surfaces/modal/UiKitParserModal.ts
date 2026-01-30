import type { ActionsBlock } from '../../blocks/layout/ActionsBlock';
import type { CalloutBlock } from '../../blocks/layout/CalloutBlock';
import type { ContextBlock } from '../../blocks/layout/ContextBlock';
import type { DividerBlock } from '../../blocks/layout/DividerBlock';
import type { ImageBlock } from '../../blocks/layout/ImageBlock';
import type { InputBlock } from '../../blocks/layout/InputBlock';
import type { SectionBlock } from '../../blocks/layout/SectionBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

type ModalSurfaceLayoutBlock = ActionsBlock | ContextBlock | DividerBlock | ImageBlock | InputBlock | SectionBlock | CalloutBlock;

export abstract class UiKitParserModal<OutputElement> extends SurfaceRenderer<OutputElement, ModalSurfaceLayoutBlock> {
	public constructor() {
		super(['actions', 'context', 'divider', 'image', 'input', 'section', 'callout']);
	}
}

export type ModalSurfaceLayout = ModalSurfaceLayoutBlock[];
