import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock.js';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer.js';

/** Layout blocks a modal accepts; every modal renderer must allow exactly these. */
export const modalSurfaceLayoutBlockTypes = [
	'actions',
	'alert',
	'callout',
	'card',
	'container',
	'context',
	'data_table',
	'data_visualization',
	'divider',
	'header',
	'image',
	'input',
	'layout',
	'markdown',
	'plan',
	'preview',
	'rich_text',
	'section',
	'table',
	'task_card',
	'video',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type ModalSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof modalSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserModal<OutputElement> extends SurfaceRenderer<OutputElement, ModalSurfaceLayoutBlock> {
	public constructor() {
		super(modalSurfaceLayoutBlockTypes);
	}
}

export type ModalSurfaceLayout = ModalSurfaceLayoutBlock[];
