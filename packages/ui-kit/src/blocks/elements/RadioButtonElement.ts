import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';

export type RadioButtonElement = Actionable<{
	type: 'radio_button';
	options: Option[];
	initialOption?: Option;
	focus_on_load?: boolean;
}>;
