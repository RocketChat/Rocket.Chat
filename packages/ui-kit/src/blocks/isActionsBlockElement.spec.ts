import { BlockElementType } from './BlockElementType';
import { isActionsBlockElement } from './isActionsBlockElement';
import type { ActionsBlock } from './layout/ActionsBlock';

describe('isActionsBlockElement', () => {
	it('should return true for all valid ActionsBlock element types', () => {
		const validTypes: Array<ActionsBlock['elements'][number]['type']> = [
			BlockElementType.BUTTON,
			BlockElementType.CHANNELS_SELECT,
			BlockElementType.CONVERSATIONS_SELECT,
			BlockElementType.DATEPICKER,
			BlockElementType.LINEAR_SCALE,
			BlockElementType.MULTI_CHANNELS_SELECT,
			BlockElementType.MULTI_CONVERSATIONS_SELECT,
			BlockElementType.MULTI_STATIC_SELECT,
			BlockElementType.MULTI_USERS_SELECT,
			BlockElementType.OVERFLOW,
			BlockElementType.STATIC_SELECT,
			BlockElementType.USERS_SELECT,
			BlockElementType.TOGGLE_SWITCH,
			BlockElementType.CHECKBOX,
			BlockElementType.RADIO_BUTTON,
			BlockElementType.TIME_PICKER,
		];

		validTypes.forEach((type) => {
			const element = { type, actionId: 'test-action-id' } as ActionsBlock['elements'][number];
			expect(isActionsBlockElement(element)).toBe(true);
		});
	});

	it('should return false for invalid element types', () => {
		const invalidTypes = [
			BlockElementType.ICON,
			BlockElementType.ICON_BUTTON,
			BlockElementType.IMAGE,
			BlockElementType.PLAIN_TEXT_INPUT,
			BlockElementType.TAB,
		];

		invalidTypes.forEach((type) => {
			const element = { type, actionId: 'test-action-id' } as any;
			expect(isActionsBlockElement(element)).toBe(false);
		});
	});
});
