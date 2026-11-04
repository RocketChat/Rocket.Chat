import type { Actionable } from '../Actionable';
import type { Option } from '../Option';

export type RadioButtonElement = Actionable<{
	type: 'radio_button' | 'radio_buttons';
	options: Option[];
	initialOption?: Option;
	focus_on_load?: boolean;
}>;
