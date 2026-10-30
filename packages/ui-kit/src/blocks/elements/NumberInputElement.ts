import type { Actionable } from '../Actionable.js';
import type { PlainText } from '../text/PlainText.js';

/** A field that only takes numbers; the value is the number as typed, as a string. */
export type NumberInputElement = Actionable<{
	type: 'number_input';
	is_decimal_allowed: boolean;
	placeholder?: PlainText;
	initial_value?: string;
	min_value?: string;
	max_value?: string;
	focus_on_load?: boolean;
}>;
