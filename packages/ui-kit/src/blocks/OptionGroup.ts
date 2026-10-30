import type { Option } from './Option.js';
import type { PlainText } from './text/PlainText.js';

export type OptionGroup = {
	label: PlainText;
	options: Option[];
};
