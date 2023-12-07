import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type PlainTextInputElement = Actionable<{
	type: 'plain_text_input';
	placeholder?: PlainText;
	initialValue?: string;
	multiline?: boolean;
	minLength?: number;
	maxLength?: number;
}>;
