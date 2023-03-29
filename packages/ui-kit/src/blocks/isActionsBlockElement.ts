import type { BlockElement } from './BlockElement';
import { BlockElementType } from './BlockElementType';
import type { ActionsBlock } from './layout/ActionsBlock';

export const isActionsBlockElement = (block: BlockElement): block is ActionsBlock['elements'][number] => {
	switch (block.type as ActionsBlock['elements'][number]['type']) {
		case BlockElementType.BUTTON:
		case BlockElementType.DATEPICKER:
		case BlockElementType.LINEAR_SCALE:
		case BlockElementType.MULTI_STATIC_SELECT:
		case BlockElementType.OVERFLOW:
		case BlockElementType.STATIC_SELECT:
			return true;

		default:
			return false;
	}
};
