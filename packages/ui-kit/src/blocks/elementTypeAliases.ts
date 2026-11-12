import type { BlockElement } from './BlockElement.js';

const elementTypeAliases = {
	checkboxes: 'checkbox',
	radio_buttons: 'radio_button',
	timepicker: 'time_picker',
} as const;

export type ElementTypeAlias = keyof typeof elementTypeAliases;

export type CanonicalElementType = Exclude<BlockElement['type'], ElementTypeAlias>;

export const toCanonicalElementType = (type: BlockElement['type']): CanonicalElementType =>
	type in elementTypeAliases ? elementTypeAliases[type as ElementTypeAlias] : (type as CanonicalElementType);

export const toCanonicalElement = (element: BlockElement): BlockElement => {
	const type = toCanonicalElementType(element.type);
	return type === element.type ? element : ({ ...element, type } as BlockElement);
};
