import type { BlockElement } from './BlockElement.js';
import { BlockElementType } from './BlockElementType.js';
import { toCanonicalElementType } from './elementTypeAliases.js';
import type { ActionsBlock } from './layout/ActionsBlock.js';

export const isActionsBlockElement = (block: BlockElement): block is ActionsBlock['elements'][number] => {
	switch (toCanonicalElementType(block.type)) {
		case BlockElementType.BUTTON:
		case BlockElementType.DATEPICKER:
		case BlockElementType.DATETIMEPICKER:
		case BlockElementType.EXTERNAL_SELECT:
		case BlockElementType.LINEAR_SCALE:
		case BlockElementType.MULTI_EXTERNAL_SELECT:
		case BlockElementType.MULTI_STATIC_SELECT:
		case BlockElementType.OVERFLOW:
		case BlockElementType.STATIC_SELECT:
		case BlockElementType.TOGGLE_SWITCH:
		case BlockElementType.CHECKBOX:
		case BlockElementType.RADIO_BUTTON:
		case BlockElementType.TIME_PICKER:
			return true;

		default:
			return false;
	}
};
