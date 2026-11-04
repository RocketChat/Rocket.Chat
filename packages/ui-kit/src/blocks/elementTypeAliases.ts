import type { BlockElement } from './BlockElement';
import type { CheckboxElement } from './elements/CheckboxElement';
import type { RadioButtonElement } from './elements/RadioButtonElement';
import type { TimePickerElement } from './elements/TimePickerElement';

const elementTypeAliases: Record<string, BlockElement['type']> = {
	checkboxes: 'checkbox',
	radio_buttons: 'radio_button',
	timepicker: 'time_picker',
};

export type AliasedBlockElement =
	| (Omit<CheckboxElement, 'type'> & { type: 'checkboxes' })
	| (Omit<RadioButtonElement, 'type'> & { type: 'radio_buttons' })
	| (Omit<TimePickerElement, 'type'> & { type: 'timepicker' });

export const toCanonicalElementType = (type: string): BlockElement['type'] => elementTypeAliases[type] ?? type;

export const toCanonicalElement = (element: BlockElement | AliasedBlockElement): BlockElement => {
	const type = toCanonicalElementType(element.type);
	return type === element.type ? (element as BlockElement) : ({ ...element, type } as BlockElement);
};
