import type { TextObject } from '../blocks/TextObject';
import type { BlockContext } from './BlockContext';

export type TextObjectRenderer<OutputElement, Block extends TextObject = TextObject> = (
	textObject: Block,
	context: BlockContext,
	index: number,
) => OutputElement | null;
