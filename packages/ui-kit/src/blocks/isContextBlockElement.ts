import type { BlockElement } from './BlockElement.js';
import { BlockElementType } from './BlockElementType.js';
import type { TextObject } from './TextObject.js';
import { TextObjectType } from './TextObjectType.js';
import type { ContextBlock } from './layout/ContextBlock.js';

export const isContextBlockElement = (block: TextObject | BlockElement): block is ContextBlock['elements'][number] => {
	switch (block.type) {
		case BlockElementType.IMAGE:
		case TextObjectType.PLAIN_TEXT:
		case TextObjectType.MRKDWN:
			return true;

		default:
			return false;
	}
};
