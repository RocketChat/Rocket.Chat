import type { BlockElement } from './BlockElement.js';
import { BlockElementType } from './BlockElementType.js';
import type { InputBlock } from './layout/InputBlock.js';

export const isInputBlockElement = (block: BlockElement): block is InputBlock['element'] => {
	switch (block.type) {
		case BlockElementType.CHANNELS_SELECT:
		case BlockElementType.CONVERSATIONS_SELECT:
		case BlockElementType.DATEPICKER:
		case BlockElementType.DATETIMEPICKER:
		case BlockElementType.LINEAR_SCALE:
		case BlockElementType.MULTI_STATIC_SELECT:
		case BlockElementType.PLAIN_TEXT_INPUT:
		case BlockElementType.NUMBER_INPUT:
		case BlockElementType.EMAIL_TEXT_INPUT:
		case BlockElementType.URL_TEXT_INPUT:
		case BlockElementType.STATIC_SELECT:
		case BlockElementType.USERS_SELECT:
			return true;

		default:
			return false;
	}
};
