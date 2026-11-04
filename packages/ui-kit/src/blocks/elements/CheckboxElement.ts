import type { Actionable } from '../Actionable';
import type { Option } from '../Option';

export type CheckboxElement = Actionable<{
	type: 'checkbox' | 'checkboxes';
	options: Option[];
	initialOptions?: Option[];
	focus_on_load?: boolean;
}>;
