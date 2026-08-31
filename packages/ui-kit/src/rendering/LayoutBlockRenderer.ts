import type { BlockContext } from './BlockContext';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock';

export type LayoutBlockRenderer<T, B extends RenderableLayoutBlock = RenderableLayoutBlock> = (
	layoutBlock: B,
	context: typeof BlockContext.BLOCK,
	index: number,
) => T | null;
