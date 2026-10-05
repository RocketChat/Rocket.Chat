import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

/** A field for a URL. */
export type UrlTextInputElement = Actionable<{
	type: 'url_text_input';
	placeholder?: PlainText;
	initialValue?: string;
}>;
