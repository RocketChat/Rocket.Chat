import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';

export type ToggleSwitchElement = Actionable<{
	type: 'toggle_switch';
	options: Option[];
	initialOptions?: Option[];
}>;
