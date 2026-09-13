import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type NumberInputElement = Actionable<{
	type: 'number_input';
	placeholder?: PlainText;
	initialValue?: string;
	isDecimalAllowed?: boolean;
	minValue?: string;
	maxValue?: string;
}>;
