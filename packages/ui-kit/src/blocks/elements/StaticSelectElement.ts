import type { Actionable } from '../Actionable';
import type { Option } from '../Option';
import type { OptionGroup } from '../OptionGroup';
import type { TextObject } from '../TextObject';

export type StaticSelectElement = Actionable<{
	type: 'static_select';
	placeholder: TextObject;
	options: readonly Option[];
	optionGroups?: readonly OptionGroup[];
	initialOption?: Option;
	initialValue?: Option['value'];
}>;
