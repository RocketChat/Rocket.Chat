import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type ButtonElement = Actionable<{
	type: 'button';
	text: PlainText;
	url?: string;
	value?: string;
	style?: 'primary' | 'danger';
}>;
