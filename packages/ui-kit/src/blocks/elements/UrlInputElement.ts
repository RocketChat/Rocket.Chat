import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type UrlInputElement = Actionable<{
	type: 'url_text_input';
	placeholder?: PlainText;
	initialValue?: string;
}>;
