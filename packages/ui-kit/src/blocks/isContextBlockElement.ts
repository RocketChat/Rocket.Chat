import type { BlockElement } from './BlockElement';
import { BlockElementType } from './BlockElementType';
import type { TextObject } from './TextObject';
import { TextObjectType } from './TextObjectType';
import type { ContextBlock } from './layout/ContextBlock';

export const isContextBlockElement = (block: TextObject | BlockElement): block is ContextBlock['elements'][number] => {
	switch (block.type as ContextBlock['elements'][number]['type']) {
		case BlockElementType.IMAGE:
		case TextObjectType.PLAIN_TEXT:
		case TextObjectType.MARKDOWN:
			return true;

		default:
			return false;
	}
};
