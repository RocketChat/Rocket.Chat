import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';

export type CheckboxElement = Actionable<{
	type: 'checkbox';
	options: Option[];
	initialOptions?: Option[];
	focus_on_load?: boolean;
}>;
