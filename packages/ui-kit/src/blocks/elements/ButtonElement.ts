import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type ButtonElement = Actionable<{
	type: 'button';
	text: PlainText;
	url?: string; // TODO: The url in ButtonElement should not be an arbitrary string, it lacks validation and can lead to security issues
	value?: string;
	style?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
	secondary?: boolean;
}>;
