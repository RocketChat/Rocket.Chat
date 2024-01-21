import type { Actionable } from '../Actionable';
import type { Option } from '../Option';

export type RadioButtonElement = Actionable<{
	type: 'radio_button';
	options: Option[];
	initialOption?: Option;
}>;
