import type { TextObject } from './TextObject.js';
import type { PlainText } from './text/PlainText.js';

export type Option = {
	text: TextObject;
	value: string;
	description?: PlainText;
	url?: string;
};
