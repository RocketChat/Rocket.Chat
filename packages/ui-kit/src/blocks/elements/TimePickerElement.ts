import type { Actionable } from '../Actionable';
import type { TextObject } from '../TextObject';

export type TimePickerElement = Actionable<{
	type: 'time_picker';
	placeholder?: TextObject;
	initialTime?: string;
	focus_on_load?: boolean;
}>;
