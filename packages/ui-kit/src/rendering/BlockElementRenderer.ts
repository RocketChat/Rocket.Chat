import type { BlockElement } from '..';
import type { BlockContext } from './BlockContext';

export type BlockElementRenderer<OutputElement, Block extends BlockElement = BlockElement> = (
	blockElement: Block,
	context: BlockContext,
	index: number,
) => OutputElement | null;
