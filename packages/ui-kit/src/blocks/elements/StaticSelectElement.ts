import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';
import type { OptionGroup } from '../OptionGroup.js';
import type { TextObject } from '../TextObject.js';

export type StaticSelectElement = Actionable<{
	type: 'static_select';
	placeholder: TextObject;
	options: readonly Option[];
	optionGroups?: readonly OptionGroup[];
	initialOption?: Option;
	initialValue?: Option['value'];
}>;
