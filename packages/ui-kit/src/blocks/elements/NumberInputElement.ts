import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

/** A field that only takes numbers; the value is the number as typed, as a string. */
export type NumberInputElement = Actionable<{
	type: 'number_input';
	isDecimalAllowed: boolean;
	placeholder?: PlainText;
	initialValue?: string;
	minValue?: string;
	maxValue?: string;
}>;
