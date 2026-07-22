import type { BlockElement } from './BlockElement';
import { BlockElementType } from './BlockElementType';
import type { InputBlock } from './layout/InputBlock';

export const isInputBlockElement = (block: BlockElement): block is InputBlock['element'] => {
	switch (block.type) {
		case BlockElementType.CHANNELS_SELECT:
		case BlockElementType.CONVERSATIONS_SELECT:
		case BlockElementType.DATEPICKER:
		case BlockElementType.LINEAR_SCALE:
		case BlockElementType.MULTI_CHANNELS_SELECT:
		case BlockElementType.MULTI_CONVERSATIONS_SELECT:
		case BlockElementType.MULTI_STATIC_SELECT:
		case BlockElementType.MULTI_USERS_SELECT:
		case BlockElementType.PLAIN_TEXT_INPUT:
		case BlockElementType.STATIC_SELECT:
		case BlockElementType.USERS_SELECT:
		case BlockElementType.CHECKBOX:
		case BlockElementType.RADIO_BUTTON:
		case BlockElementType.TIME_PICKER:
		case BlockElementType.TOGGLE_SWITCH:
			return true;

		default:
			return false;
	}
};
