import type { RenderableLayoutBlock } from '../../blocks/RenderableLayoutBlock';
import { SurfaceRenderer } from '../../rendering/SurfaceRenderer';

/** Layout blocks a contextual bar accepts; every contextual bar renderer must allow exactly these. */
export const contextualBarSurfaceLayoutBlockTypes = [
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
	'tab_navigation',
] as const satisfies readonly RenderableLayoutBlock['type'][];

type ContextualBarSurfaceLayoutBlock = Extract<RenderableLayoutBlock, { type: (typeof contextualBarSurfaceLayoutBlockTypes)[number] }>;

export abstract class UiKitParserContextualBar<OutputElement> extends SurfaceRenderer<OutputElement, ContextualBarSurfaceLayoutBlock> {
	public constructor() {
		super(contextualBarSurfaceLayoutBlockTypes);
	}
}

export type ContextualBarSurfaceLayout = ContextualBarSurfaceLayoutBlock[];
