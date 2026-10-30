import type { Actionable } from '../Actionable.js';
import type { TextObject } from '../TextObject.js';

export type DatePickerElement = Actionable<{
	type: 'datepicker';
	placeholder?: TextObject;
	initialDate?: string;
	focus_on_load?: boolean;
}>;
