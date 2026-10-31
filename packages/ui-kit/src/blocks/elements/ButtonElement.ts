import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type ButtonElement = Actionable<{
	type: 'button';
	text: PlainText;
	url?: string;
	value?: string;
	style?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
	secondary?: boolean;
	/** What assistive technology announces instead of `text`, when the visible text alone is ambiguous. */
	accessibility_label?: string;
}>;
