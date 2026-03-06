import { BlockElementType } from './BlockElementType';
import { isInputBlockElement } from './isInputBlockElement';
import type { InputBlock } from './layout/InputBlock';

describe('isInputBlockElement', () => {
	it('should return true for all valid InputBlock element types', () => {
		const validTypes: Array<InputBlock['element']['type']> = [
			BlockElementType.CHANNELS_SELECT,
			BlockElementType.CONVERSATIONS_SELECT,
			BlockElementType.DATEPICKER,
			BlockElementType.LINEAR_SCALE,
			BlockElementType.MULTI_CHANNELS_SELECT,
			BlockElementType.MULTI_CONVERSATIONS_SELECT,
			BlockElementType.MULTI_STATIC_SELECT,
			BlockElementType.MULTI_USERS_SELECT,
			BlockElementType.PLAIN_TEXT_INPUT,
			BlockElementType.STATIC_SELECT,
			BlockElementType.USERS_SELECT,
			BlockElementType.CHECKBOX,
			BlockElementType.RADIO_BUTTON,
			BlockElementType.TIME_PICKER,
			BlockElementType.TOGGLE_SWITCH,
		];

		validTypes.forEach((type) => {
			const element = { type, actionId: 'test-action-id' } as InputBlock['element'];
			expect(isInputBlockElement(element)).toBe(true);
		});
	});

	it('should return false for invalid element types', () => {
		const invalidTypes = [
			BlockElementType.BUTTON,
			BlockElementType.ICON,
			BlockElementType.ICON_BUTTON,
			BlockElementType.IMAGE,
			BlockElementType.OVERFLOW,
			BlockElementType.TAB,
		];

		invalidTypes.forEach((type) => {
			const element = { type, actionId: 'test-action-id' } as any;
			expect(isInputBlockElement(element)).toBe(false);
		});
	});
});
