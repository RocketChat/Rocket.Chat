import type { Actionable } from '../Actionable.js';
import type { TextObject } from '../TextObject.js';

export type TimePickerElement = Actionable<{
	type: 'time_picker';
	placeholder?: TextObject;
	initialTime?: string;
	focus_on_load?: boolean;
}>;
