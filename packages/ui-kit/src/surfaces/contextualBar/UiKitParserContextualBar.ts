import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock.js';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer.js';

/** Layout blocks a contextual bar accepts; every contextual bar renderer must allow exactly these. */
export const contextualBarSurfaceLayoutBlockTypes = [
	'actions',
	'alert',
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
	'tab_navigation',
	'table',
	'task_card',
	'video',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type ContextualBarSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof contextualBarSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserContextualBar<OutputElement> extends SurfaceRenderer<OutputElement, ContextualBarSurfaceLayoutBlock> {
	public constructor() {
		super(contextualBarSurfaceLayoutBlockTypes);
	}
}

export type ContextualBarSurfaceLayout = ContextualBarSurfaceLayoutBlock[];
