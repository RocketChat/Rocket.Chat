import type { Actionable } from '../Actionable.js';
import type { PlainText } from '../text/PlainText.js';

/** A field for a URL. */
export type UrlTextInputElement = Actionable<{
	type: 'url_text_input';
	placeholder?: PlainText;
	initial_value?: string;
	focus_on_load?: boolean;
}>;
