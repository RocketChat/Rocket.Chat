import type { TextObject } from './TextObject';
import type { PlainText } from './text/PlainText';

export type Option = {
	text: TextObject;
	value: string;
	description?: PlainText;
	url?: string;
};
