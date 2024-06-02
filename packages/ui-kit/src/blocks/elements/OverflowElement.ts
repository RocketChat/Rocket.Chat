import type { Actionable } from '../Actionable';
import type { Option } from '../Option';

export type OverflowElement = Actionable<{
	type: 'overflow';
	options: readonly Option[];
}>;
