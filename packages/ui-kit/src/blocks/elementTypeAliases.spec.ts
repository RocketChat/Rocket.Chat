import type { BlockElement } from './BlockElement.js';
import { toCanonicalElement, toCanonicalElementType } from './elementTypeAliases.js';
import { isActionsBlockElement } from './isActionsBlockElement.js';
import { isSectionBlockAccessoryElement } from './isSectionBlockAccessoryElement.js';
import type { ActionOf } from '../rendering/ActionOf.js';
import type { CheckboxElement } from './elements/CheckboxElement.js';
import type { RadioButtonElement } from './elements/RadioButtonElement.js';
import type { TimePickerElement } from './elements/TimePickerElement.js';

const option = { text: { type: 'plain_text', text: 'A' }, value: 'a' } as const;
const ids = { appId: 'a', blockId: 'b', actionId: 'c' };

const aliased = {
	checkboxes: { type: 'checkboxes', options: [option], ...ids },
	radio_buttons: { type: 'radio_buttons', options: [option], ...ids },
	timepicker: { type: 'timepicker', ...ids },
} as const satisfies Record<string, BlockElement>;

it.each([
	['checkboxes', 'checkbox'],
	['radio_buttons', 'radio_button'],
	['timepicker', 'time_picker'],
	['checkbox', 'checkbox'],
	['button', 'button'],
] as const)('maps %s to %s', (alias, canonical) => {
	expect(toCanonicalElementType(alias)).toBe(canonical);
});

it('only changes the type of an aliased element', () => {
	expect(toCanonicalElement(aliased.checkboxes)).toEqual({ ...aliased.checkboxes, type: 'checkbox' });
});

it('returns a canonical element as is', () => {
	const element: BlockElement = { type: 'checkbox', options: [], ...ids };

	expect(toCanonicalElement(element)).toBe(element);
});

it.each(Object.values(aliased))('accepts $type where its canonical type is accepted', (element) => {
	expect(isActionsBlockElement(element)).toBe(true);
	expect(isSectionBlockAccessoryElement(element)).toBe(true);
});

it('gives an aliased element the action value of its canonical element', () => {
	const checkboxes: ActionOf<CheckboxElement> = ['a'];
	const radio: ActionOf<RadioButtonElement> = undefined;
	const time: ActionOf<TimePickerElement> = '10:30';

	expect([checkboxes, radio, time]).toBeDefined();
});
