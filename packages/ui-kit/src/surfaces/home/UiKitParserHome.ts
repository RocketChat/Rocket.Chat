import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock.js';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer.js';

/** Layout blocks a home accepts; every home renderer must allow exactly these. */
export const homeSurfaceLayoutBlockTypes = [
	'actions',
	'alert',
	'callout',
	'card',
	'carousel',
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

type HomeSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof homeSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserHome<OutputElement> extends SurfaceRenderer<OutputElement, HomeSurfaceLayoutBlock> {
	public constructor() {
		super(homeSurfaceLayoutBlockTypes);
	}
}

export type HomeSurfaceLayout = HomeSurfaceLayoutBlock[];
