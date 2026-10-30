import type { BlockContext } from './BlockContext.js';
import type { TextObject } from '../blocks/TextObject.js';

export type TextObjectRenderer<OutputElement, Block extends TextObject = TextObject> = (
	textObject: Block,
	context: BlockContext,
	index: number,
) => OutputElement | null;
