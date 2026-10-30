import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';
import type { OptionGroup } from '../OptionGroup.js';
import type { TextObject } from '../TextObject.js';

export type MultiStaticSelectElement = Actionable<{
	type: 'multi_static_select';
	placeholder: TextObject;
	options: readonly Option[];
	optionGroups?: readonly OptionGroup[];
	maxSelectItems?: number;
	initialValue?: Option['value'][];
	initialOption?: Option[];
}>;
