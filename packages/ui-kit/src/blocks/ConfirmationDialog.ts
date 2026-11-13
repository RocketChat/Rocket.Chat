import type { TextObject } from './TextObject.js';
import type { PlainText } from './text/PlainText.js';

export type ConfirmationDialog = {
	title: PlainText;
	text: TextObject;
	confirm: PlainText;
	deny: PlainText;
	style: 'primary' | 'danger';
};
