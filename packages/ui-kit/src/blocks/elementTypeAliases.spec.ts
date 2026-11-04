import type { BlockElement } from './BlockElement';
import { toCanonicalElement, toCanonicalElementType } from './elementTypeAliases';
import { isActionsBlockElement } from './isActionsBlockElement';
import { isSectionBlockAccessoryElement } from './isSectionBlockAccessoryElement';

it.each([
	['checkboxes', 'checkbox'],
	['radio_buttons', 'radio_button'],
	['timepicker', 'time_picker'],
	['checkbox', 'checkbox'],
	['button', 'button'],
])('maps %s to %s', (alias, canonical) => {
	expect(toCanonicalElementType(alias)).toBe(canonical);
});

it('only changes the type of an aliased element', () => {
	const element = { type: 'checkboxes', options: [], appId: 'a', blockId: 'b', actionId: 'c' } as unknown as BlockElement;

	expect(toCanonicalElement(element)).toEqual({ ...element, type: 'checkbox' });
});

it('returns a canonical element as is', () => {
	const element = { type: 'checkbox', options: [], appId: 'a', blockId: 'b', actionId: 'c' } as BlockElement;

	expect(toCanonicalElement(element)).toBe(element);
});

it.each(['checkboxes', 'radio_buttons', 'timepicker'])('accepts %s where its canonical type is accepted', (type) => {
	const element = { type } as unknown as BlockElement;

	expect(isActionsBlockElement(element)).toBe(true);
	expect(isSectionBlockAccessoryElement(element)).toBe(true);
});
