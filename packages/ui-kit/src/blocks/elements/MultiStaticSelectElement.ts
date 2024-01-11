import type { Actionable } from '../Actionable';
import type { Option } from '../Option';
import type { OptionGroup } from '../OptionGroup';
import type { TextObject } from '../TextObject';

export type MultiStaticSelectElement = Actionable<{
	type: 'multi_static_select';
	placeholder: TextObject;
	options: readonly Option[];
	optionGroups?: readonly OptionGroup[];
	maxSelectItems?: number;
	initialValue?: Option['value'][];
	initialOption?: Option[];
}>;
