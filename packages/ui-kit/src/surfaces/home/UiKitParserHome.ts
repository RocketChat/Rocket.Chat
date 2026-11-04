import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

/** Layout blocks a home accepts; every home renderer must allow exactly these. */
export const homeSurfaceLayoutBlockTypes = [
	'actions',
	'callout',
	'context',
	'divider',
	'header',
	'image',
	'input',
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
