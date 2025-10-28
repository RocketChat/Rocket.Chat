import type { BlockElement } from './BlockElement';
import { BlockElementType } from './BlockElementType';
import type { SectionBlock } from './layout/SectionBlock';

export const isSectionBlockAccessoryElement = (block: BlockElement): block is Exclude<SectionBlock['accessory'], undefined> => {
	switch (block.type as Exclude<SectionBlock['accessory'], undefined>['type']) {
		case BlockElementType.BUTTON:
		case BlockElementType.DATEPICKER:
		case BlockElementType.IMAGE:
		case BlockElementType.MULTI_STATIC_SELECT:
		case BlockElementType.OVERFLOW:
		case BlockElementType.STATIC_SELECT:
			return true;

		default:
			return false;
	}
};
