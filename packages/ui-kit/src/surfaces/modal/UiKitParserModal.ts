import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

/** Layout blocks a modal accepts; every modal renderer must allow exactly these. */
export const modalSurfaceLayoutBlockTypes = [
	'actions',
	'callout',
	'context',
	'divider',
	'header',
	'image',
	'input',
	'markdown',
	'preview',
	'section',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type ModalSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof modalSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserModal<OutputElement> extends SurfaceRenderer<OutputElement, ModalSurfaceLayoutBlock> {
	public constructor() {
		super(modalSurfaceLayoutBlockTypes);
	}
}

export type ModalSurfaceLayout = ModalSurfaceLayoutBlock[];
