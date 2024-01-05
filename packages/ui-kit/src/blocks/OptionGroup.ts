import type { Option } from './Option';
import type { PlainText } from './text/PlainText';

export type OptionGroup = {
	label: PlainText;
	options: Option[];
};
