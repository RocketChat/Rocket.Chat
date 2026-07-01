import type { ActionsBlock } from '../../blocks/layout/ActionsBlock';
import type { ContextBlock } from '../../blocks/layout/ContextBlock';
import type { DividerBlock } from '../../blocks/layout/DividerBlock';
import type { HeaderBlock } from '../../blocks/layout/HeaderBlock';
import type { ImageBlock } from '../../blocks/layout/ImageBlock';
import type { InputBlock } from '../../blocks/layout/InputBlock';
import type { SectionBlock } from '../../blocks/layout/SectionBlock';
import type { VideoBlock } from '../../blocks/layout/VideoBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

type ContextualBarSurfaceLayoutBlock =
	| ActionsBlock
	| ContextBlock
	| DividerBlock
	| HeaderBlock
	| ImageBlock
	| InputBlock
	| SectionBlock
	| VideoBlock;

export abstract class UiKitParserContextualBar<OutputElement> extends SurfaceRenderer<OutputElement, ContextualBarSurfaceLayoutBlock> {
	public constructor() {
		super(['actions', 'context', 'divider', 'header', 'image', 'input', 'section', 'video']);
	}
}

export type ContextualBarSurfaceLayout = ContextualBarSurfaceLayoutBlock[];
