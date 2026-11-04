import type { Actionable } from '../Actionable.js';
import type { TextObject } from '../TextObject.js';

export type TimePickerElement = Actionable<{
	type: 'time_picker';
	placeholder?: TextObject;
	initialTime?: string;
	/** IANA name of the time zone `initialTime` and the picked time are in; the user's own when absent. */
	timezone?: string;
	focus_on_load?: boolean;
}>;
