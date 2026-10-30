import type { BlockContext } from './BlockContext.js';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock.js';

export type LayoutBlockRenderer<T, B extends RenderableLayoutBlock = RenderableLayoutBlock> = (
	layoutBlock: B,
	context: typeof BlockContext.BLOCK,
	index: number,
) => T | null;
