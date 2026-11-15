import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

/** A field for an email address. */
export type EmailTextInputElement = Actionable<{
	type: 'email_text_input';
	placeholder?: PlainText;
	initial_value?: string;
	focus_on_load?: boolean;
}>;
