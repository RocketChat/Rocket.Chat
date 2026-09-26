import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type EmailInputElement = Actionable<{
	type: 'email_text_input';
	placeholder?: PlainText;
	initialValue?: string;
}>;
