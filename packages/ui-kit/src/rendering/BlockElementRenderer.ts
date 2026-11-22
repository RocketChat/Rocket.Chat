import type { BlockElement } from '../index.js';
import type { BlockContext } from './BlockContext.js';

export type BlockElementRenderer<OutputElement, Block extends BlockElement = BlockElement> = (
	blockElement: Block,
	context: BlockContext,
	index: number,
) => OutputElement | null;
